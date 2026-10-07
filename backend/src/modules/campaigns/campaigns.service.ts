import { abStats, abThreshold, inTestGroup } from './ab.util';
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

  private async loadTemplate(workspaceId: string, templateId: string) {
    const t = await this.templates.findOne({ where: { id: templateId, workspaceId } });
    if (!t) throw new BadRequestException('Selected template not found (it may have been deleted)');
    return t;
  }

  private async assertSenderExists(workspaceId: string, senderId: string) {
    const s = await this.senders.findOne({ where: { id: senderId, workspaceId } });
    if (!s) throw new BadRequestException('Selected sender identity not found');
  }

  async create(workspaceId: string, userId: string, dto: CreateCampaignDto) {
    await this.billing.assertQuota(workspaceId, 'campaigns');
    const data: any = { ...dto };
    // BUG FIX: a template chosen at creation time was stored as an id only, so the
    // campaign came out empty. Copy its content, same as update() does.
    if (dto.templateId) {
      const t = await this.loadTemplate(workspaceId, dto.templateId);
      data.htmlContent = dto.htmlContent || t.htmlContent;
      data.subject = dto.subject || t.subject;
      data.previewText = dto.previewText || t.previewText;
      data.designJson = dto.designJson ?? t.designJson;
    }
    if (dto.senderIdentityId) await this.assertSenderExists(workspaceId, dto.senderIdentityId);
    const saved = await this.campaigns.save(this.campaigns.create({ ...data, workspaceId, createdBy: userId, status: 'draft' }));
    await this.billing.increment(workspaceId, 'campaignsCreated', 1);
    return saved;
  }

  async update(workspaceId: string, id: string, dto: UpdateCampaignDto) {
    const c = await this.findOne(workspaceId, id);
    if (!EDITABLE.includes(c.status)) throw new BadRequestException(`A ${c.status} campaign cannot be edited`);

    // Pulling in a template copies its content so later template edits never mutate a sent campaign.
    if (dto.templateId && dto.templateId !== c.templateId) {
      const t = await this.loadTemplate(workspaceId, dto.templateId);
      dto.htmlContent = dto.htmlContent ?? t.htmlContent;
      dto.subject = dto.subject ?? t.subject;
      dto.previewText = dto.previewText ?? t.previewText;
      dto.designJson = dto.designJson ?? t.designJson;
    }
    if (dto.senderIdentityId && dto.senderIdentityId !== c.senderIdentityId) await this.assertSenderExists(workspaceId, dto.senderIdentityId);
    // The winner is decided by the server — an edit must never wipe or forge it.
    if (dto.settings && c.settings?.abWinner) (dto as any).settings = { ...dto.settings, abWinner: c.settings.abWinner, abDecidedAt: c.settings.abDecidedAt };
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

    const warnings = this.lint(c);
    if (abThreshold(c.settings) !== null && count < 200) warnings.push('Auto-winner works best with 200+ recipients — with a small audience the test group is too small to be meaningful');
    return { valid: issues.length === 0, issues, warnings, estimatedRecipients: count };
  }

  /** Non-blocking deliverability / quality hints shown on the review step. */
  lint(c: Campaign): string[] {
    const w: string[] = [];
    const subject = c.subject || '';
    const html = c.htmlContent || '';
    if (subject.length > 60) w.push(`Subject is ${subject.length} characters — most inboxes cut it off after ~60`);
    if (/[A-Z]{6,}/.test(subject.replace(/\{\{[^}]*\}\}/g, ''))) w.push('Subject has ALL-CAPS words — a common spam trigger');
    if ((subject.match(/!/g) || []).length > 1) w.push('Avoid multiple exclamation marks in the subject');
    if (/\b(free money|act now|100% free|winner|guaranteed|click here|no risk)\b/i.test(subject + ' ' + html.replace(/<[^>]+>/g, ' '))) {
      w.push('Content contains spam-trigger phrases (e.g. "act now", "100% free")');
    }
    if (!/<a\s[^>]*href/i.test(html)) w.push('No links found — add a call-to-action');
    if (/<img(?![^>]*\balt=)[^>]*>/i.test(html)) w.push('Some images have no alt text');
    if ((c.settings?.subjectB || '').length > 60) w.push('Subject B is longer than 60 characters');
    if (!c.previewText) w.push('Preview text is empty — inboxes will show random body text instead');
    if (c.settings?.includeUnsubscribeLink === false && !html.includes('{{unsubscribe_url}}')) {
      w.push('No unsubscribe link — risks spam complaints and legal trouble');
    }
    const tags = html.match(/\{\{[^}]*\}\}/g) || [];
    if (tags.some((t) => !/^\{\{\s*[a-zA-Z0-9_.]+\s*(\|\s*default:\s*["'][^"']*["']\s*)?\}\}$/.test(t))) {
      w.push('A merge tag looks malformed — use {{first_name}} or {{first_name | default: "there"}}');
    }
    return w;
  }

  /** A/B subject results: variant A = even last hex digit of recipient id, B = odd. */
  async abResults(workspaceId: string, id: string) {
    const c = await this.findOne(workspaceId, id);
    if (!c.settings?.subjectB) return { enabled: false, variants: [] };
    const T = abThreshold(c.settings);
    const { a, b } = await abStats(this.dataSource, id, workspaceId, T);
    const va = { label: 'A', subject: c.subject || c.name, ...a };
    const vb = { label: 'B', subject: c.settings.subjectB, ...b };
    if (T !== null) {
      const cfg = c.settings.abAutoWinner!;
      const decided = c.settings.abWinner;
      const m = cfg.metric === 'clicks' ? 'click' : 'open';
      return {
        enabled: true, auto: true, variants: [va, vb], winner: decided ?? null,
        note: decided
          ? `Auto-winner: Subject ${decided} was picked by ${m} rate and sent to the rest of your audience.`
          : `Test phase: ${cfg.testPercent}% of your audience is receiving A/B. The winner (by ${m} rate) is picked automatically ${cfg.waitHours}h after the test finishes and sent to everyone else.`,
      };
    }
    const winner = va.sent < 20 || vb.sent < 20 ? null : va.openRate === vb.openRate ? null : va.openRate > vb.openRate ? 'A' : 'B';
    return { enabled: true, variants: [va, vb], winner, note: winner ? undefined : 'Not enough data yet for a clear winner (needs 20+ sends per variant).' };
  }

  /** Save the campaign's current content as a reusable template. */
  async saveAsTemplate(workspaceId: string, id: string, userId: string, name?: string) {
    const c = await this.findOne(workspaceId, id);
    if (!c.htmlContent) throw new BadRequestException('Add email content first');
    return this.templates.save(this.templates.create({
      workspaceId, createdBy: userId, name: name || c.name, category: 'general',
      subject: c.subject, previewText: c.previewText, htmlContent: c.htmlContent, designJson: c.designJson,
    }));
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

    let pending = await this.recipients.find({ where: { campaignId: id, status: In(['pending', 'queued']) }, take: 50000 });
    // Auto-winner A/B still in its test phase: never release the held-back audience early.
    const abT = abThreshold(c.settings);
    if (abT !== null && !c.settings?.abWinner) pending = pending.filter((r) => inTestGroup(r.id, abT));
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
      id: 'test', email: recipients[0], firstName: 'FirstName', lastName: 'LastName',
      customAttributes: { company: 'Acme', city: 'Delhi' },
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
