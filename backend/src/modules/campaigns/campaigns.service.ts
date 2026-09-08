import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination.dto';
import {
  Campaign, CampaignRecipient, Contact, ContactListMember, EmailTemplate, SenderIdentity, Suppression,
} from '@/database/entities';
import { htmlToText, renderMergeTags } from '@/integrations/email/renderer';
import { EmailService } from '@/integrations/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';
import { SegmentsService } from '@/modules/segments/segments.service';
import { SendersService } from '@/modules/senders/senders.service';
import { QueueService } from '@/queues/queue.service';
import { QUEUES } from '@/queues/queue.constants';
import { CreateCampaignDto, QueryCampaignsDto, UpdateCampaignDto } from './dto';

const EDITABLE = ['draft', 'scheduled', 'paused', 'failed'];

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private campaigns: Repository<Campaign>,
    @InjectRepository(CampaignRecipient) private recipients: Repository<CampaignRecipient>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(EmailTemplate) private templates: Repository<EmailTemplate>,
    @InjectRepository(SenderIdentity) private senders: Repository<SenderIdentity>,
    @InjectRepository(Suppression) private suppressions: Repository<Suppression>,
    private segments: SegmentsService,
    private sendersSvc: SendersService,
    private email: EmailService,
    private queue: QueueService,
    private config: ConfigService,
    private dataSource: DataSource,
    private billing: BillingService,
  ) {}

  async findAll(workspaceId: string, q: QueryCampaignsDto) {
    const qb = this.campaigns.createQueryBuilder('c').where('c.workspace_id = :workspaceId', { workspaceId });
    if (q.status) qb.andWhere('c.status = :status', { status: q.status });
    if (q.search) {
      const s = `%${q.search}%`;
      qb.andWhere(new Brackets((w) => w.where('c.name LIKE :s', { s }).orWhere('c.subject LIKE :s', { s })));
    }
    qb.orderBy('c.created_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, q.page, q.limit);
  }

  async findOne(workspaceId: string, id: string) {
    const c = await this.campaigns.findOne({ where: { id, workspaceId } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async create(workspaceId: string, userId: string, dto: CreateCampaignDto) {
    await this.billing.assertQuota(workspaceId, 'campaigns');
    const saved = await this.campaigns.save(this.campaigns.create({ ...dto, workspaceId, createdBy: userId, status: 'draft' }));
    await this.billing.increment(workspaceId, 'campaignsCreated', 1);
    return saved;
  }

  async update(workspaceId: string, id: string, dto: UpdateCampaignDto) {
    const c = await this.findOne(workspaceId, id);
    if (!EDITABLE.includes(c.status)) throw new BadRequestException(`A ${c.status} campaign cannot be edited`);

    // Pulling in a template copies its content so later template edits never mutate a sent campaign.
    if (dto.templateId && dto.templateId !== c.templateId) {
      const t = await this.templates.findOne({ where: { id: dto.templateId, workspaceId } });
      if (!t) throw new BadRequestException('Template not found');
      dto.htmlContent = dto.htmlContent ?? t.htmlContent;
      dto.subject = dto.subject ?? t.subject;
      dto.previewText = dto.previewText ?? t.previewText;
      dto.designJson = dto.designJson ?? t.designJson;
    }
    await this.campaigns.update(id, dto as any);
    return this.findOne(workspaceId, id);
  }

  async remove(workspaceId: string, id: string) {
    const c = await this.findOne(workspaceId, id);
    if (['sending', 'preparing'].includes(c.status)) throw new BadRequestException('A sending campaign cannot be deleted');
    await this.campaigns.softDelete(id);
    return { message: 'Campaign deleted' };
  }

  async duplicate(workspaceId: string, id: string, userId: string) {
    const c = await this.findOne(workspaceId, id);
    const { id: _i, createdAt, updatedAt, ...rest } = c as any;
    return this.campaigns.save(this.campaigns.create({
      ...rest, name: `${c.name} (copy)`, status: 'draft', createdBy: userId,
      scheduledAt: null, startedAt: null, completedAt: null,
      totalRecipients: 0, sentCount: 0, deliveredCount: 0, failedCount: 0, bouncedCount: 0,
      complainedCount: 0, unsubscribedCount: 0, uniqueOpens: 0, totalOpens: 0, uniqueClicks: 0, totalClicks: 0,
    }));
  }

  /**
   * Resolves the audience minus everything that must never receive marketing mail.
   * Used both for the wizard's estimate and for the real send.
   */
  async resolveAudience(workspaceId: string, campaign: Campaign, countOnly = false) {
    const audience = campaign.audience || { mode: 'all' };
    const qb = this.contacts.createQueryBuilder('c')
      .where('c.workspace_id = :workspaceId', { workspaceId })
      .andWhere('c.status = :active', { active: 'active' })
      .andWhere('c.subscribed = 1')
      .andWhere(`NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.workspace_id = c.workspace_id AND s.email = c.email)`);

    if (audience.mode === 'lists' && audience.listIds?.length) {
      qb.andWhere(`EXISTS (SELECT 1 FROM contact_list_members m WHERE m.contact_id = c.id AND m.list_id IN (:...listIds))`,
        { listIds: audience.listIds });
    }

    if (audience.mode === 'segments' && audience.segmentIds?.length) {
      const segs = await Promise.all(audience.segmentIds.map((id) => this.segments.findOne(workspaceId, id)));
      qb.andWhere(new Brackets((w) => {
        segs.forEach((seg, i) => {
          const sub = this.contacts.createQueryBuilder(`sc${i}`).select(`sc${i}.id`)
            .where(`sc${i}.workspace_id = :workspaceId`, { workspaceId });
          this.segments.applyRules(sub, seg, `sc${i}`);
          w.orWhere(`c.id IN (${sub.getQuery()})`, sub.getParameters());
        });
      }));
    }

    if (audience.excludeListIds?.length) {
      qb.andWhere(`NOT EXISTS (SELECT 1 FROM contact_list_members m2 WHERE m2.contact_id = c.id AND m2.list_id IN (:...ex))`,
        { ex: audience.excludeListIds });
    }

    if (countOnly) return { count: await qb.getCount(), query: qb };
    return { count: await qb.getCount(), query: qb };
  }

  async estimateAudience(workspaceId: string, id: string) {
    const campaign = await this.findOne(workspaceId, id);
    const { count } = await this.resolveAudience(workspaceId, campaign, true);
    const suppressed = await this.suppressions.count({ where: { workspaceId } });
    return { estimatedRecipients: count, suppressedInWorkspace: suppressed };
  }

  /** Everything that must be true before a campaign may leave the building. */
  async validate(workspaceId: string, id: string) {
    const c = await this.findOne(workspaceId, id);
    const issues: string[] = [];
    if (!c.subject?.trim()) issues.push('Subject line is required');
    if (!c.htmlContent?.trim()) issues.push('Email content is required');
    if (!c.senderIdentityId) issues.push('A sender identity must be selected');
    else {
      const sender = await this.senders.findOne({ where: { id: c.senderIdentityId, workspaceId } });
      if (!sender) issues.push('The selected sender no longer exists');
      else if (sender.status !== 'verified' && !this.config.get('email.allowUnverifiedSenders')) {
        issues.push(`Sender ${sender.fromEmail} is not verified`);
      }
    }
    const { count } = await this.resolveAudience(workspaceId, c, true);
    if (!count) issues.push('The selected audience contains no sendable contacts');

    return { valid: issues.length === 0, issues, estimatedRecipients: count };
  }

  async send(workspaceId: string, id: string) {
    const campaign = await this.findOne(workspaceId, id);
    if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
      throw new BadRequestException(`A ${campaign.status} campaign cannot be sent`);
    }
    const check = await this.validate(workspaceId, id);
    if (!check.valid) throw new BadRequestException(check.issues[0]);

    // Quota is checked against the whole audience before anything is queued,
    // so a campaign never goes out half-sent because the plan ran dry mid-flight.
    await this.billing.assertQuota(workspaceId, 'emails', check.estimatedRecipients);

    await this.campaigns.update(id, { status: 'preparing', startedAt: new Date(), scheduledAt: null });
    await this.queue.add(QUEUES.CAMPAIGN_PREPARATION, 'prepare', { campaignId: id, workspaceId });
    return { message: 'Campaign queued for sending', estimatedRecipients: check.estimatedRecipients };
  }

  async schedule(workspaceId: string, id: string, when: string) {
    const scheduledAt = new Date(when);
    if (isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000) {
      throw new BadRequestException('Pick a time at least one minute in the future');
    }
    const check = await this.validate(workspaceId, id);
    if (!check.valid) throw new BadRequestException(check.issues[0]);

    await this.campaigns.update(id, { status: 'scheduled', scheduledAt });
    await this.queue.add(QUEUES.SCHEDULED_CAMPAIGNS, 'scheduled-send',
      { campaignId: id, workspaceId },
      { delay: scheduledAt.getTime() - Date.now(), jobId: `sched:${id}` });
    return { message: 'Campaign scheduled', scheduledAt };
  }

  async pause(workspaceId: string, id: string) {
    const c = await this.findOne(workspaceId, id);
    if (!['sending', 'scheduled', 'preparing'].includes(c.status)) {
      throw new BadRequestException('Only a scheduled or sending campaign can be paused');
    }
    await this.campaigns.update(id, { status: 'paused' });
    await this.queue.queue(QUEUES.SCHEDULED_CAMPAIGNS).remove(`sched:${id}`).catch(() => null);
    return { message: 'Campaign paused' };
  }

  async resume(workspaceId: string, id: string) {
    const c = await this.findOne(workspaceId, id);
    if (c.status !== 'paused') throw new BadRequestException('Only a paused campaign can be resumed');

    const pending = await this.recipients.find({ where: { campaignId: id, status: In(['pending', 'queued']) }, take: 50000 });
    await this.campaigns.update(id, { status: 'sending' });
    if (pending.length) {
      await this.queue.addBulk(QUEUES.EMAIL_SENDING, pending.map((r) => ({
        name: 'send', data: { recipientId: r.id, campaignId: id, workspaceId },
      })));
    }
    return { message: 'Campaign resumed', requeued: pending.length };
  }

  async cancel(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.campaigns.update(id, { status: 'cancelled' });
    await this.recipients.update({ campaignId: id, status: In(['pending', 'queued']) }, { status: 'skipped' });
    return { message: 'Campaign cancelled' };
  }

  /** Test send — never touches campaign_recipients, tracking, or statistics. */
  async sendTest(workspaceId: string, id: string, recipients: string[]) {
    const c = await this.findOne(workspaceId, id);
    if (!c.htmlContent) throw new BadRequestException('Add email content before sending a test');
    const sender = c.senderIdentityId
      ? await this.sendersSvc.assertSendable(workspaceId, c.senderIdentityId)
      : null;

    const sample = {
      id: 'test', email: recipients[0], firstName: 'Alex', lastName: 'Sharma',
      customAttributes: { company: 'CodeWins', city: 'Delhi' },
    };
    const html = renderMergeTags(c.htmlContent, sample);
    const subject = `[TEST] ${renderMergeTags(c.subject || c.name, sample)}`;

    const results = [];
    for (const to of recipients.slice(0, 5)) {
      const res = await this.email.send({
        workspaceId, to, subject, html, text: htmlToText(html),
        fromName: sender?.fromName || 'MailFlow',
        fromEmail: sender?.fromEmail || this.config.get('email.from'),
        replyTo: sender?.replyToEmail,
      });
      results.push({ to, sent: res.accepted, error: res.error });
    }
    return { results };
  }

  async recipients_(workspaceId: string, id: string, q: { page: number; limit: number; status?: string; search?: string }) {
    const qb = this.recipients.createQueryBuilder('r')
      .where('r.workspace_id = :workspaceId', { workspaceId })
      .andWhere('r.campaign_id = :id', { id });
    if (q.status) qb.andWhere('r.status = :status', { status: q.status });
    if (q.search) qb.andWhere('r.email LIKE :s', { s: `%${q.search}%` });
    qb.orderBy('r.created_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, q.page, q.limit);
  }
}
