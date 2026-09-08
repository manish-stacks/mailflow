import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignEvent, CampaignRecipient, Contact, TrackedLink } from '@/database/entities';
import { verifyToken } from '@/common/tokens';

export const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(CampaignRecipient) private recipients: Repository<CampaignRecipient>,
    @InjectRepository(Campaign) private campaigns: Repository<Campaign>,
    @InjectRepository(CampaignEvent) private events: Repository<CampaignEvent>,
    @InjectRepository(TrackedLink) private links: Repository<TrackedLink>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    private config: ConfigService,
  ) {}

  async open(token: string, meta: { ip?: string; userAgent?: string }) {
    const payload = verifyToken<{ r: string; c: string }>(token, this.config.get('trackingSecret'));
    if (!payload) return;

    const recipient = await this.recipients.findOne({ where: { id: payload.r, campaignId: payload.c } });
    if (!recipient) return;

    const isFirst = !recipient.openedAt;
    await this.recipients.update(recipient.id, {
      openedAt: recipient.openedAt || new Date(),
      openCount: recipient.openCount + 1,
    });

    // dedupeKey makes the first open idempotent, so unique opens stay unique.
    await this.events.createQueryBuilder().insert().into(CampaignEvent).values({
      workspaceId: recipient.workspaceId, campaignId: payload.c,
      campaignRecipientId: recipient.id, contactId: recipient.contactId,
      eventType: 'opened', metadata: { ip: meta.ip, userAgent: meta.userAgent?.slice(0, 200) } as any,
      dedupeKey: isFirst ? `open:${recipient.id}` : null,
    }).orIgnore().execute();

    await this.campaigns.increment({ id: payload.c }, 'totalOpens', 1);
    if (isFirst) {
      await this.campaigns.increment({ id: payload.c }, 'uniqueOpens', 1);
      await this.contacts.update(recipient.contactId, { lastEngagedAt: new Date() });
    }
  }

  /** Returns the destination URL only when it matches a link stored at prepare time. */
  async click(token: string, meta: { ip?: string; userAgent?: string }): Promise<string | null> {
    const payload = verifyToken<{ r: string; c: string; l: string }>(token, this.config.get('trackingSecret'));
    if (!payload) return null;

    const link = await this.links.findOne({ where: { id: payload.l, campaignId: payload.c } });
    if (!link) return null; // no open-redirect: unknown links go nowhere

    const recipient = await this.recipients.findOne({ where: { id: payload.r, campaignId: payload.c } });
    if (recipient) {
      const isFirst = !recipient.clickedAt;
      await this.recipients.update(recipient.id, {
        clickedAt: recipient.clickedAt || new Date(),
        clickCount: recipient.clickCount + 1,
        openedAt: recipient.openedAt || new Date(),
      });
      await this.events.createQueryBuilder().insert().into(CampaignEvent).values({
        workspaceId: recipient.workspaceId, campaignId: payload.c,
        campaignRecipientId: recipient.id, contactId: recipient.contactId,
        eventType: 'clicked', metadata: { url: link.url, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 200) } as any,
        dedupeKey: isFirst ? `click:${recipient.id}:${link.id}` : null,
      }).orIgnore().execute();

      await this.links.increment({ id: link.id }, 'totalClicks', 1);
      await this.campaigns.increment({ id: payload.c }, 'totalClicks', 1);
      if (isFirst) {
        await this.links.increment({ id: link.id }, 'uniqueClicks', 1);
        await this.campaigns.increment({ id: payload.c }, 'uniqueClicks', 1);
        await this.contacts.update(recipient.contactId, { lastEngagedAt: new Date() });
      }
    }
    return link.url;
  }
}
