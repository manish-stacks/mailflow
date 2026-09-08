import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { verifyToken } from '@/common/tokens';
import { Campaign, CampaignEvent, CampaignRecipient, Contact, Suppression, Unsubscribe, Workspace } from '@/database/entities';

const maskEmail = (e: string) => {
  const [u, d] = e.split('@');
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(1, u.length - 2))}@${d}`;
};

@Injectable()
export class UnsubscribeService {
  constructor(
    @InjectRepository(CampaignRecipient) private recipients: Repository<CampaignRecipient>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(Suppression) private suppressions: Repository<Suppression>,
    @InjectRepository(Unsubscribe) private unsubs: Repository<Unsubscribe>,
    @InjectRepository(CampaignEvent) private events: Repository<CampaignEvent>,
    @InjectRepository(Campaign) private campaigns: Repository<Campaign>,
    @InjectRepository(Workspace) private workspaces: Repository<Workspace>,
    private config: ConfigService,
  ) {}

  private decode(token: string) {
    const p = verifyToken<{ r: string; w: string; ct: string }>(token, this.config.get('trackingSecret'));
    if (!p) throw new BadRequestException('This unsubscribe link is invalid or has expired');
    return p;
  }

  /** Shown on the public unsubscribe page; the address is masked. */
  async info(token: string) {
    const p = this.decode(token);
    const contact = await this.contacts.findOne({ where: { id: p.ct, workspaceId: p.w } });
    const ws = await this.workspaces.findOne({ where: { id: p.w } });
    return {
      email: contact ? maskEmail(contact.email) : null,
      workspaceName: ws?.name || 'this sender',
      alreadyUnsubscribed: contact ? !contact.subscribed : false,
    };
  }

  async unsubscribe(token: string, reason?: string, ip?: string) {
    const p = this.decode(token);
    const contact = await this.contacts.findOne({ where: { id: p.ct, workspaceId: p.w } });
    if (!contact) throw new BadRequestException('Contact not found');

    await this.contacts.update(contact.id, { status: 'unsubscribed', subscribed: false });
    await this.suppressions.createQueryBuilder().insert()
      .values({ workspaceId: p.w, email: contact.email, reason: 'unsubscribe', source: 'link' })
      .orIgnore().execute();
    await this.unsubs.save(this.unsubs.create({
      workspaceId: p.w, contactId: contact.id, email: contact.email, reason, ip,
    }));

    const recipient = await this.recipients.findOne({ where: { id: p.r } });
    if (recipient) {
      await this.recipients.update(recipient.id, { unsubscribedAt: new Date() });
      await this.events.createQueryBuilder().insert().into(CampaignEvent).values({
        workspaceId: p.w, campaignId: recipient.campaignId, campaignRecipientId: recipient.id,
        contactId: contact.id, eventType: 'unsubscribed', metadata: { reason } as any,
        dedupeKey: `unsub:${recipient.id}`,
      }).orIgnore().execute();
      await this.campaigns.increment({ id: recipient.campaignId }, 'unsubscribedCount', 1);
    }
    return { message: 'You have been unsubscribed' };
  }

  async resubscribe(token: string) {
    const p = this.decode(token);
    const contact = await this.contacts.findOne({ where: { id: p.ct, workspaceId: p.w } });
    if (!contact) throw new BadRequestException('Contact not found');
    await this.contacts.update(contact.id, { status: 'active', subscribed: true });
    await this.suppressions.delete({ workspaceId: p.w, email: contact.email, reason: 'unsubscribe' });
    return { message: 'You have been resubscribed' };
  }
}
