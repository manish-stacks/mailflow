import { Injectable, Logger } from '@nestjs/common';
import { BillingService } from '@/modules/billing/billing.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
import { SuppressionService } from '@/modules/suppression/suppression.service';
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
    private suppression: SuppressionService,
  ) {}

  /** Tiny in-process TTL cache so a 10k-email campaign doesn't re-read the same rows 10k times. */
  private cache = new Map<string, { exp: number; v: any }>();
  private async cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.exp > Date.now()) return hit.v as T;
    const v = await fn();
    this.cache.set(key, { exp: Date.now() + ttlMs, v });
    if (this.cache.size > 500) for (const [k, e] of this.cache) if (e.exp < Date.now()) this.cache.delete(k);
    return v;
  }

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
        where: { campaignId, contactId: In(batch.map((b) => b.id)) },
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
    // Tiny campaigns can finish sending before prepare() flips the status — close them out here.
    await this.maybeComplete(campaignId);
  }

  /** Queue: email-sending. Returns false when the job should be retried. */
  async dispatch(recipientId: string, campaignId: string, workspaceId: string): Promise<boolean> {
    const recipient = await this.recipients.findOne({ where: { id: recipientId, workspaceId } });
    if (!recipient || ['sent', 'delivered', 'skipped'].includes(recipient.status)) return true;

    const campaign = await this.cached(`c:${campaignId}`, 3000, () => this.campaigns.findOne({ where: { id: campaignId, workspaceId } }));
    if (!campaign) return true;
    if (['paused', 'cancelled'].includes(campaign.status)) return true;

    // Atomic claim: two workers (or a duplicate job after pause/resume) can never send the same recipient twice.
    // A claim older than 5 minutes is treated as a crashed worker and may be taken over.
    const claim = await this.recipients.createQueryBuilder().update()
      .set({ sentAt: new Date() })
      .where('id = :id AND (sent_at IS NULL OR sent_at < :stale)', { id: recipientId, stale: new Date(Date.now() - 5 * 60_000) })
      .execute();
    if (!claim.affected) return true;

    const contact = await this.contacts.findOne({ where: { id: recipient.contactId } });
    // Last-moment eligibility check: someone may have unsubscribed while the job waited.
    if (!contact || contact.status !== 'active' || !contact.subscribed) {
      await this.recipients.update(recipientId, { status: 'skipped', errorMessage: 'Contact is no longer eligible' });
      return true;
    }

    const sender = campaign.senderIdentityId
      ? await this.cached(`s:${campaign.senderIdentityId}`, 60_000, () => this.senders.findOne({ where: { id: campaign.senderIdentityId } }))
      : null;

    const html = await this.renderFor(campaign, recipient, contact, workspaceId);
    // A/B subject test: deterministic 50/50 split on the recipient id's last hex digit (matches abResults SQL).
    const variantB = !!campaign.settings?.subjectB && parseInt(recipient.id.slice(-1), 16) % 2 === 1;
    const rawSubject = variantB ? campaign.settings!.subjectB! : (campaign.subject || campaign.name);
    const subject = renderMergeTags(rawSubject, this.contactVars(contact));

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
      // Raw SMTP relays (Hostinger, Gmail, custom servers) have no delivery webhook —
      // the sending server's "accepted" response is the only delivery signal we'll
      // ever get, so treat it as delivered instead of leaving recipients stuck on
      // "sent" forever. ESP providers with real webhooks (SES/etc.) will override
      // this to 'bounced'/'complained' later via webhooks.service.ts if that fires.
      await this.recipients.update(recipientId, { status: 'delivered', sentAt: new Date(), deliveredAt: new Date(), messageId: res.messageId });
      await Promise.all([
        this.campaigns.createQueryBuilder().update()
          .set({ sentCount: () => 'sent_count + 1', deliveredCount: () => 'delivered_count + 1' })
          .where('id = :id', { id: campaignId }).execute(),
        this.billing.increment(workspaceId, 'emailsSent', 1),
        this.events.createQueryBuilder().insert().values((['sent', 'delivered'].map((eventType) => ({
          workspaceId, campaignId, campaignRecipientId: recipientId, contactId: contact.id,
          eventType: eventType as any, metadata: { messageId: res.messageId }, dedupeKey: null,
        })) as any)).orIgnore().execute(),
      ]);
      await this.maybeComplete(campaignId);
      return true;
    }

    if (res.retryable) {
      await this.recipients.update(recipientId, { sentAt: null as any }); // release the claim so the retry can run
      return false; // BullMQ retries with backoff
    }

    await this.recipients.update(recipientId, { status: 'failed', errorMessage: res.error?.slice(0, 480) });
    await this.campaigns.increment({ id: campaignId }, 'failedCount', 1);
    await this.recordEvent(workspaceId, campaignId, recipientId, contact.id, 'failed', { error: res.error });

    // Permanent failure = the mailbox/domain doesn't exist or hard-rejected us.
    // Suppress it so future campaigns skip this address — repeated bounces to a
    // dead address are what get an SMTP account rate-limited or blocked.
    if (this.isHardBounce(res.error)) {
      await this.suppression.add(workspaceId, [contact.email], 'bounced').catch(() => null);
      await this.campaigns.increment({ id: campaignId }, 'bouncedCount', 1);
      await this.recordEvent(workspaceId, campaignId, recipientId, contact.id, 'bounced', { error: res.error });
    }

    await this.maybeComplete(campaignId);
    return true;
  }

  /** Called by the worker when a send job has used up all retries — otherwise the recipient would stay
   *  'queued' forever and the campaign could never complete. */
  async finalizeFailure(recipientId: string, campaignId: string, workspaceId: string, error: string) {
    const r = await this.recipients.findOne({ where: { id: recipientId, workspaceId } });
    if (!r || !['pending', 'queued'].includes(r.status)) return;
    await this.recipients.update(recipientId, { status: 'failed', errorMessage: `Gave up after retries: ${error}`.slice(0, 480) });
    await this.campaigns.increment({ id: campaignId }, 'failedCount', 1);
    await this.recordEvent(workspaceId, campaignId, recipientId, r.contactId, 'failed', { error, final: true });
    await this.maybeComplete(campaignId);
  }

  /** True for permanent SMTP rejections (bad mailbox/domain) — false for temporary/greylisting errors. */
  private isHardBounce(error?: string): boolean {
    if (!error) return false;
    const e = error.toLowerCase();
    return /\b5\d\d\b/.test(e) || /user unknown|does not exist|no such user|mailbox unavailable|invalid recipient|recipient rejected/.test(e);
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

    const linkRows = await this.cached(`l:${campaign.id}`, 60_000, () => this.links.find({ where: { campaignId: campaign.id } }));
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
      `SELECT 1 AS x FROM campaign_recipients WHERE campaign_id = ? AND status IN ('pending','queued') LIMIT 1`, [campaignId]);
    if (!remaining.length) {
      await this.campaigns.update({ id: campaignId, status: 'sending' as any }, { status: 'completed', completedAt: new Date() });
    }
  }
}