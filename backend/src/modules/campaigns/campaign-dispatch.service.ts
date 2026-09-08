import { Injectable, Logger } from '@nestjs/common';
import { BillingService } from '@/modules/billing/billing.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Campaign, CampaignEvent, CampaignRecipient, Contact, SenderIdentity, TrackedLink,
} from '@/database/entities';
import { EmailService } from '@/integrations/email/email.service';
import {
  applyUnsubscribe, extractLinks, hashUrl, htmlToText, injectClickTracking, injectOpenPixel,
  renderMergeTags, unsubscribeUrl,
} from '@/integrations/email/renderer';
import { QueueService } from '@/queues/queue.service';
import { QUEUES } from '@/queues/queue.constants';
import { CampaignsService } from './campaigns.service';

/**
 * The part of campaign sending that runs inside workers.
 * Preparation materialises recipients; dispatch renders and sends one email.
 */
@Injectable()
export class CampaignDispatchService {
  private readonly logger = new Logger(CampaignDispatchService.name);

  constructor(
    @InjectRepository(Campaign) private campaigns: Repository<Campaign>,
    @InjectRepository(CampaignRecipient) private recipients: Repository<CampaignRecipient>,
    @InjectRepository(CampaignEvent) private events: Repository<CampaignEvent>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(SenderIdentity) private senders: Repository<SenderIdentity>,
    @InjectRepository(TrackedLink) private links: Repository<TrackedLink>,
    private campaignsSvc: CampaignsService,
    private email: EmailService,
    private queue: QueueService,
    private config: ConfigService,
    private dataSource: DataSource,
    private billing: BillingService,
  ) {}

  /** Queue: campaign-preparation */
  async prepare(campaignId: string, workspaceId: string) {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId, workspaceId } });
    if (!campaign) return;
    if (!['preparing', 'scheduled', 'paused'].includes(campaign.status)) {
      this.logger.warn(`Campaign ${campaignId} is ${campaign.status}; preparation aborted`);
      return;
    }

    // Snapshot trackable links so click URLs stay stable for the campaign's life.
    const urls = extractLinks(campaign.htmlContent || '');
    for (const url of urls) {
      await this.links.createQueryBuilder().insert()
        .values({ workspaceId, campaignId, url, urlHash: hashUrl(url) }).orIgnore().execute();
    }

    const { query } = await this.campaignsSvc.resolveAudience(workspaceId, campaign);
    const batchSize = 2000;
    let offset = 0;
    let total = 0;

    for (;;) {
      const batch = await query.clone().orderBy('c.id', 'ASC').skip(offset).take(batchSize).getMany();
      if (!batch.length) break;

      await this.recipients.createQueryBuilder().insert()
        .values(batch.map((c) => ({
          workspaceId, campaignId, contactId: c.id, email: c.email, status: 'pending' as const,
        })))
        .orIgnore().execute();

      const saved = await this.recipients.find({
        where: { campaignId, contactId: batch.map((b) => b.id) as any },
        select: ['id'],
      }).catch(() => []);

      const rows = saved.length ? saved : await this.dataSource.query(
        `SELECT id FROM campaign_recipients WHERE campaign_id = ? AND status = 'pending' LIMIT ? OFFSET ?`,
        [campaignId, batchSize, offset]);

      await this.queue.addBulk(QUEUES.EMAIL_SENDING, rows.map((r: any) => ({
        name: 'send', data: { recipientId: r.id, campaignId, workspaceId },
      })));
      await this.recipients.createQueryBuilder().update()
        .set({ status: 'queued' }).whereInIds(rows.map((r: any) => r.id)).execute();

      total += batch.length;
      offset += batchSize;
    }

    await this.campaigns.update(campaignId, { status: 'sending', totalRecipients: total });
    this.logger.log(`Campaign ${campaignId} prepared with ${total} recipients`);
  }

  /** Queue: email-sending. Returns false when the job should be retried. */
  async dispatch(recipientId: string, campaignId: string, workspaceId: string): Promise<boolean> {
    const recipient = await this.recipients.findOne({ where: { id: recipientId, workspaceId } });
    if (!recipient || ['sent', 'delivered', 'skipped'].includes(recipient.status)) return true;

    const campaign = await this.campaigns.findOne({ where: { id: campaignId, workspaceId } });
    if (!campaign) return true;
    if (['paused', 'cancelled'].includes(campaign.status)) return true;

    const contact = await this.contacts.findOne({ where: { id: recipient.contactId } });
    // Last-moment eligibility check: someone may have unsubscribed while the job waited.
    if (!contact || contact.status !== 'active' || !contact.subscribed) {
      await this.recipients.update(recipientId, { status: 'skipped', errorMessage: 'Contact is no longer eligible' });
      return true;
    }

    const sender = campaign.senderIdentityId
      ? await this.senders.findOne({ where: { id: campaign.senderIdentityId } })
      : null;

    const html = await this.renderFor(campaign, recipient, contact, workspaceId);
    const subject = renderMergeTags(campaign.subject || campaign.name, this.contactVars(contact));

    const unsub = unsubscribeUrl({
      secret: this.config.get('trackingSecret'),
      appBaseUrl: this.config.get('appBaseUrl'),
      recipientId: recipient.id, workspaceId, contactId: contact.id,
    });

    const res = await this.email.send({
      workspaceId,
      to: recipient.email,
      subject,
      html,
      text: htmlToText(html),
      fromName: sender?.fromName || 'MailFlow',
      fromEmail: sender?.fromEmail || this.config.get('email.from'),
      replyTo: campaign.settings?.replyTo || sender?.replyToEmail,
      headers: {
        'List-Unsubscribe': `<${unsub}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Campaign-Id': campaign.id,
      },
    });

    if (res.accepted) {
      await this.recipients.update(recipientId, { status: 'sent', sentAt: new Date(), messageId: res.messageId });
      await this.campaigns.increment({ id: campaignId }, 'sentCount', 1);
      await this.billing.increment(workspaceId, 'emailsSent', 1);
      await this.recordEvent(workspaceId, campaignId, recipientId, contact.id, 'sent', { messageId: res.messageId });
      await this.maybeComplete(campaignId);
      return true;
    }

    if (res.retryable) return false; // BullMQ retries with backoff

    await this.recipients.update(recipientId, { status: 'failed', errorMessage: res.error?.slice(0, 480) });
    await this.campaigns.increment({ id: campaignId }, 'failedCount', 1);
    await this.recordEvent(workspaceId, campaignId, recipientId, contact.id, 'failed', { error: res.error });
    await this.maybeComplete(campaignId);
    return true;
  }

  private contactVars(contact: Contact) {
    return {
      id: contact.id, email: contact.email,
      firstName: contact.firstName, lastName: contact.lastName,
      customAttributes: contact.customAttributes || {},
    };
  }

  private async renderFor(campaign: Campaign, recipient: CampaignRecipient, contact: Contact, workspaceId: string) {
    const secret = this.config.get('trackingSecret');
    const trackingBase = this.config.get('trackingBaseUrl');

    const linkRows = await this.links.find({ where: { campaignId: campaign.id } });
    const linkIds = new Map(linkRows.map((l) => [l.urlHash, l.id]));

    const settings = campaign.settings || {};
    let html = renderMergeTags(campaign.htmlContent || '', this.contactVars(contact));

    if (settings.includeUnsubscribeLink !== false) {
      html = applyUnsubscribe(html, unsubscribeUrl({
        secret, appBaseUrl: this.config.get('appBaseUrl'),
        recipientId: recipient.id, workspaceId, contactId: contact.id,
      }));
    }
    if (settings.trackClicks !== false) {
      html = injectClickTracking(html, { secret, baseUrl: trackingBase, recipientId: recipient.id, campaignId: campaign.id, linkIds });
    }
    if (settings.trackOpens !== false) {
      html = injectOpenPixel(html, { secret, baseUrl: trackingBase, recipientId: recipient.id, campaignId: campaign.id });
    }
    return html;
  }

  async recordEvent(
    workspaceId: string, campaignId: string, recipientId: string, contactId: string,
    eventType: any, metadata: any = null, dedupeKey?: string,
  ) {
    await this.events.createQueryBuilder().insert().values({
      workspaceId, campaignId, campaignRecipientId: recipientId, contactId, eventType, metadata,
      dedupeKey: dedupeKey || null,
    }).orIgnore().execute();
  }

  private async maybeComplete(campaignId: string) {
    const remaining = await this.dataSource.query(
      `SELECT COUNT(*) AS c FROM campaign_recipients WHERE campaign_id = ? AND status IN ('pending','queued')`, [campaignId]);
    if (+remaining[0].c === 0) {
      await this.campaigns.update({ id: campaignId, status: 'sending' as any }, { status: 'completed', completedAt: new Date() });
    }
  }
}
