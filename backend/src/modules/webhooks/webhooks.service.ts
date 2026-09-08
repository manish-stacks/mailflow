import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignEvent, CampaignRecipient, Contact, Suppression } from '@/database/entities';
import { EmailService } from '@/integrations/email/email.service';

type Normalised = { messageId?: string; email?: string; type: string; timestamp?: Date; raw?: any };

const HARD_BOUNCE = ['bounce', 'bounced', 'hard_bounce', 'hardbounce', 'failed', 'rejected'];

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(CampaignRecipient) private recipients: Repository<CampaignRecipient>,
    @InjectRepository(CampaignEvent) private events: Repository<CampaignEvent>,
    @InjectRepository(Campaign) private campaigns: Repository<Campaign>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(Suppression) private suppressions: Repository<Suppression>,
    private email: EmailService,
  ) {}

  verify(provider: string, headers: any, rawBody: string) {
    return this.email.provider.name === provider && this.email.provider.verifyWebhook(headers, rawBody);
  }

  parse(payload: any): Normalised[] {
    return this.email.provider.parseWebhook(payload);
  }

  async process(event: Normalised) {
    const recipient = event.messageId
      ? await this.recipients.findOne({ where: { messageId: event.messageId } })
      : await this.recipients.findOne({ where: { email: event.email?.toLowerCase() }, order: { createdAt: 'DESC' } });

    if (!recipient) {
      this.logger.debug(`Webhook event ${event.type} did not match any recipient`);
      return;
    }

    const when = event.timestamp || new Date();
    const type = event.type.toLowerCase();

    if (type === 'delivered') {
      await this.recipients.update(recipient.id, { status: 'delivered', deliveredAt: when });
      await this.campaigns.increment({ id: recipient.campaignId }, 'deliveredCount', 1);
      await this.record(recipient, 'delivered', event, `delivered:${recipient.id}`);
      return;
    }

    if (HARD_BOUNCE.includes(type)) {
      await this.recipients.update(recipient.id, { status: 'bounced', bouncedAt: when, errorMessage: String(event.raw?.reason || '').slice(0, 480) });
      await this.campaigns.increment({ id: recipient.campaignId }, 'bouncedCount', 1);
      await this.record(recipient, 'bounced', event, `bounce:${recipient.id}`);
      await this.suppress(recipient, 'hard_bounce');
      return;
    }

    if (type === 'complained' || type === 'complaint' || type === 'spam') {
      await this.campaigns.increment({ id: recipient.campaignId }, 'complainedCount', 1);
      await this.record(recipient, 'complained', event, `complaint:${recipient.id}`);
      await this.suppress(recipient, 'complaint');
      return;
    }

    if (type === 'deferred' || type === 'soft_bounce') {
      await this.record(recipient, 'failed', event); // transient: no suppression
      return;
    }

    this.logger.debug(`Unhandled webhook event type: ${type}`);
  }

  private async record(recipient: CampaignRecipient, eventType: any, event: Normalised, dedupeKey?: string) {
    await this.events.createQueryBuilder().insert().values({
      workspaceId: recipient.workspaceId,
      campaignId: recipient.campaignId,
      campaignRecipientId: recipient.id,
      contactId: recipient.contactId,
      eventType,
      metadata: event.raw ? { provider: event.raw } : null,
      dedupeKey: dedupeKey || null,
    }).orIgnore().execute();
  }

  private async suppress(recipient: CampaignRecipient, reason: 'hard_bounce' | 'complaint') {
    await this.suppressions.createQueryBuilder().insert()
      .values({ workspaceId: recipient.workspaceId, email: recipient.email, reason, source: 'webhook' })
      .orIgnore().execute();
    await this.contacts.update(
      { workspaceId: recipient.workspaceId, email: recipient.email },
      { status: reason === 'complaint' ? 'complained' : 'bounced', subscribed: false },
    );
  }
}
