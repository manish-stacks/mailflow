"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const ab_util_1 = require("./ab.util");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const entities_1 = require("../../database/entities");
const renderer_1 = require("../../integrations/email/renderer");
const email_service_1 = require("../../integrations/email/email.service");
const billing_service_1 = require("../billing/billing.service");
const segments_service_1 = require("../segments/segments.service");
const senders_service_1 = require("../senders/senders.service");
const queue_service_1 = require("../../queues/queue.service");
const queue_constants_1 = require("../../queues/queue.constants");
const EDITABLE = ['draft', 'scheduled', 'paused', 'failed'];
let CampaignsService = class CampaignsService {
    campaigns;
    recipients;
    contacts;
    templates;
    senders;
    suppressions;
    segments;
    sendersSvc;
    email;
    queue;
    config;
    dataSource;
    billing;
    constructor(campaigns, recipients, contacts, templates, senders, suppressions, segments, sendersSvc, email, queue, config, dataSource, billing) {
        this.campaigns = campaigns;
        this.recipients = recipients;
        this.contacts = contacts;
        this.templates = templates;
        this.senders = senders;
        this.suppressions = suppressions;
        this.segments = segments;
        this.sendersSvc = sendersSvc;
        this.email = email;
        this.queue = queue;
        this.config = config;
        this.dataSource = dataSource;
        this.billing = billing;
    }
    async findAll(workspaceId, q) {
        const qb = this.campaigns.createQueryBuilder('c').where('c.workspace_id = :workspaceId', { workspaceId });
        if (q.status)
            qb.andWhere('c.status = :status', { status: q.status });
        if (q.search) {
            const s = `%${q.search}%`;
            qb.andWhere(new typeorm_2.Brackets((w) => w.where('c.name LIKE :s', { s }).orWhere('c.subject LIKE :s', { s })));
        }
        qb.orderBy('c.created_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_dto_1.paginate)(data, total, q.page, q.limit);
    }
    async findOne(workspaceId, id) {
        const c = await this.campaigns.findOne({ where: { id, workspaceId } });
        if (!c)
            throw new common_1.NotFoundException('Campaign not found');
        return c;
    }
    async loadTemplate(workspaceId, templateId) {
        const t = await this.templates.findOne({ where: { id: templateId, workspaceId } });
        if (!t)
            throw new common_1.BadRequestException('Selected template not found (it may have been deleted)');
        return t;
    }
    async assertSenderExists(workspaceId, senderId) {
        const s = await this.senders.findOne({ where: { id: senderId, workspaceId } });
        if (!s)
            throw new common_1.BadRequestException('Selected sender identity not found');
    }
    async create(workspaceId, userId, dto) {
        await this.billing.assertQuota(workspaceId, 'campaigns');
        const data = { ...dto };
        // BUG FIX: a template chosen at creation time was stored as an id only, so the
        // campaign came out empty. Copy its content, same as update() does.
        if (dto.templateId) {
            const t = await this.loadTemplate(workspaceId, dto.templateId);
            data.htmlContent = dto.htmlContent || t.htmlContent;
            data.subject = dto.subject || t.subject;
            data.previewText = dto.previewText || t.previewText;
            data.designJson = dto.designJson ?? t.designJson;
        }
        if (dto.senderIdentityId)
            await this.assertSenderExists(workspaceId, dto.senderIdentityId);
        const saved = await this.campaigns.save(this.campaigns.create({ ...data, workspaceId, createdBy: userId, status: 'draft' }));
        await this.billing.increment(workspaceId, 'campaignsCreated', 1);
        return saved;
    }
    async update(workspaceId, id, dto) {
        const c = await this.findOne(workspaceId, id);
        if (!EDITABLE.includes(c.status))
            throw new common_1.BadRequestException(`A ${c.status} campaign cannot be edited`);
        // Pulling in a template copies its content so later template edits never mutate a sent campaign.
        if (dto.templateId && dto.templateId !== c.templateId) {
            const t = await this.loadTemplate(workspaceId, dto.templateId);
            dto.htmlContent = dto.htmlContent ?? t.htmlContent;
            dto.subject = dto.subject ?? t.subject;
            dto.previewText = dto.previewText ?? t.previewText;
            dto.designJson = dto.designJson ?? t.designJson;
        }
        if (dto.senderIdentityId && dto.senderIdentityId !== c.senderIdentityId)
            await this.assertSenderExists(workspaceId, dto.senderIdentityId);
        // The winner is decided by the server — an edit must never wipe or forge it.
        if (dto.settings && c.settings?.abWinner)
            dto.settings = { ...dto.settings, abWinner: c.settings.abWinner, abDecidedAt: c.settings.abDecidedAt };
        await this.campaigns.update(id, dto);
        return this.findOne(workspaceId, id);
    }
    async remove(workspaceId, id) {
        const c = await this.findOne(workspaceId, id);
        if (['sending', 'preparing'].includes(c.status))
            throw new common_1.BadRequestException('A sending campaign cannot be deleted');
        await this.campaigns.softDelete(id);
        return { message: 'Campaign deleted' };
    }
    async duplicate(workspaceId, id, userId) {
        const c = await this.findOne(workspaceId, id);
        const { id: _i, createdAt, updatedAt, ...rest } = c;
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
    async resolveAudience(workspaceId, campaign, countOnly = false) {
        const audience = campaign.audience || { mode: 'all' };
        const qb = this.contacts.createQueryBuilder('c')
            .where('c.workspace_id = :workspaceId', { workspaceId })
            .andWhere('c.status = :active', { active: 'active' })
            .andWhere('c.subscribed = 1')
            .andWhere(`NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.workspace_id = c.workspace_id AND s.email = c.email)`);
        if (audience.mode === 'lists' && audience.listIds?.length) {
            qb.andWhere(`EXISTS (SELECT 1 FROM contact_list_members m WHERE m.contact_id = c.id AND m.list_id IN (:...listIds))`, { listIds: audience.listIds });
        }
        if (audience.mode === 'segments' && audience.segmentIds?.length) {
            const segs = await Promise.all(audience.segmentIds.map((id) => this.segments.findOne(workspaceId, id)));
            qb.andWhere(new typeorm_2.Brackets((w) => {
                segs.forEach((seg, i) => {
                    const sub = this.contacts.createQueryBuilder(`sc${i}`).select(`sc${i}.id`)
                        .where(`sc${i}.workspace_id = :workspaceId`, { workspaceId });
                    this.segments.applyRules(sub, seg, `sc${i}`);
                    w.orWhere(`c.id IN (${sub.getQuery()})`, sub.getParameters());
                });
            }));
        }
        if (audience.excludeListIds?.length) {
            qb.andWhere(`NOT EXISTS (SELECT 1 FROM contact_list_members m2 WHERE m2.contact_id = c.id AND m2.list_id IN (:...ex))`, { ex: audience.excludeListIds });
        }
        return { count: await qb.getCount(), query: qb };
    }
    async estimateAudience(workspaceId, id) {
        const campaign = await this.findOne(workspaceId, id);
        const { count } = await this.resolveAudience(workspaceId, campaign, true);
        const suppressed = await this.suppressions.count({ where: { workspaceId } });
        return { estimatedRecipients: count, suppressedInWorkspace: suppressed };
    }
    /** Everything that must be true before a campaign may leave the building. */
    async validate(workspaceId, id) {
        const c = await this.findOne(workspaceId, id);
        const issues = [];
        if (!c.subject?.trim())
            issues.push('Subject line is required');
        if (!c.htmlContent?.trim())
            issues.push('Email content is required');
        if (!c.senderIdentityId)
            issues.push('A sender identity must be selected');
        else {
            const sender = await this.senders.findOne({ where: { id: c.senderIdentityId, workspaceId } });
            if (!sender)
                issues.push('The selected sender no longer exists');
            else if (sender.status !== 'verified' && !this.config.get('email.allowUnverifiedSenders')) {
                issues.push(`Sender ${sender.fromEmail} is not verified`);
            }
        }
        const { count } = await this.resolveAudience(workspaceId, c, true);
        if (!count)
            issues.push('The selected audience contains no sendable contacts');
        const warnings = this.lint(c);
        if ((0, ab_util_1.abThreshold)(c.settings) !== null && count < 200)
            warnings.push('Auto-winner works best with 200+ recipients — with a small audience the test group is too small to be meaningful');
        return { valid: issues.length === 0, issues, warnings, estimatedRecipients: count };
    }
    /** Non-blocking deliverability / quality hints shown on the review step. */
    lint(c) {
        const w = [];
        const subject = c.subject || '';
        const html = c.htmlContent || '';
        if (subject.length > 60)
            w.push(`Subject is ${subject.length} characters — most inboxes cut it off after ~60`);
        if (/[A-Z]{6,}/.test(subject.replace(/\{\{[^}]*\}\}/g, '')))
            w.push('Subject has ALL-CAPS words — a common spam trigger');
        if ((subject.match(/!/g) || []).length > 1)
            w.push('Avoid multiple exclamation marks in the subject');
        if (/\b(free money|act now|100% free|winner|guaranteed|click here|no risk)\b/i.test(subject + ' ' + html.replace(/<[^>]+>/g, ' '))) {
            w.push('Content contains spam-trigger phrases (e.g. "act now", "100% free")');
        }
        if (!/<a\s[^>]*href/i.test(html))
            w.push('No links found — add a call-to-action');
        if (/<img(?![^>]*\balt=)[^>]*>/i.test(html))
            w.push('Some images have no alt text');
        if ((c.settings?.subjectB || '').length > 60)
            w.push('Subject B is longer than 60 characters');
        if (!c.previewText)
            w.push('Preview text is empty — inboxes will show random body text instead');
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
    async abResults(workspaceId, id) {
        const c = await this.findOne(workspaceId, id);
        if (!c.settings?.subjectB)
            return { enabled: false, variants: [] };
        const T = (0, ab_util_1.abThreshold)(c.settings);
        const { a, b } = await (0, ab_util_1.abStats)(this.dataSource, id, workspaceId, T);
        const va = { label: 'A', subject: c.subject || c.name, ...a };
        const vb = { label: 'B', subject: c.settings.subjectB, ...b };
        if (T !== null) {
            const cfg = c.settings.abAutoWinner;
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
    async saveAsTemplate(workspaceId, id, userId, name) {
        const c = await this.findOne(workspaceId, id);
        if (!c.htmlContent)
            throw new common_1.BadRequestException('Add email content first');
        return this.templates.save(this.templates.create({
            workspaceId, createdBy: userId, name: name || c.name, category: 'general',
            subject: c.subject, previewText: c.previewText, htmlContent: c.htmlContent, designJson: c.designJson,
        }));
    }
    async send(workspaceId, id) {
        const campaign = await this.findOne(workspaceId, id);
        if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
            throw new common_1.BadRequestException(`A ${campaign.status} campaign cannot be sent`);
        }
        const check = await this.validate(workspaceId, id);
        if (!check.valid)
            throw new common_1.BadRequestException(check.issues[0]);
        // Quota is checked against the whole audience before anything is queued,
        // so a campaign never goes out half-sent because the plan ran dry mid-flight.
        await this.billing.assertQuota(workspaceId, 'emails', check.estimatedRecipients);
        await this.campaigns.update(id, { status: 'preparing', startedAt: new Date(), scheduledAt: null });
        await this.queue.add(queue_constants_1.QUEUES.CAMPAIGN_PREPARATION, 'prepare', { campaignId: id, workspaceId });
        return { message: 'Campaign queued for sending', estimatedRecipients: check.estimatedRecipients };
    }
    async schedule(workspaceId, id, when) {
        const scheduledAt = new Date(when);
        if (isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000) {
            throw new common_1.BadRequestException('Pick a time at least one minute in the future');
        }
        const check = await this.validate(workspaceId, id);
        if (!check.valid)
            throw new common_1.BadRequestException(check.issues[0]);
        await this.campaigns.update(id, { status: 'scheduled', scheduledAt });
        await this.queue.add(queue_constants_1.QUEUES.SCHEDULED_CAMPAIGNS, 'scheduled-send', { campaignId: id, workspaceId }, { delay: scheduledAt.getTime() - Date.now(), jobId: `sched:${id}` });
        return { message: 'Campaign scheduled', scheduledAt };
    }
    async pause(workspaceId, id) {
        const c = await this.findOne(workspaceId, id);
        if (!['sending', 'scheduled', 'preparing'].includes(c.status)) {
            throw new common_1.BadRequestException('Only a scheduled or sending campaign can be paused');
        }
        await this.campaigns.update(id, { status: 'paused' });
        await this.queue.queue(queue_constants_1.QUEUES.SCHEDULED_CAMPAIGNS).remove(`sched:${id}`).catch(() => null);
        return { message: 'Campaign paused' };
    }
    async resume(workspaceId, id) {
        const c = await this.findOne(workspaceId, id);
        if (c.status !== 'paused')
            throw new common_1.BadRequestException('Only a paused campaign can be resumed');
        let pending = await this.recipients.find({ where: { campaignId: id, status: (0, typeorm_2.In)(['pending', 'queued']) }, take: 50000 });
        // Auto-winner A/B still in its test phase: never release the held-back audience early.
        const abT = (0, ab_util_1.abThreshold)(c.settings);
        if (abT !== null && !c.settings?.abWinner)
            pending = pending.filter((r) => (0, ab_util_1.inTestGroup)(r.id, abT));
        await this.campaigns.update(id, { status: 'sending' });
        if (pending.length) {
            await this.queue.addBulk(queue_constants_1.QUEUES.EMAIL_SENDING, pending.map((r) => ({
                name: 'send', data: { recipientId: r.id, campaignId: id, workspaceId },
            })));
        }
        return { message: 'Campaign resumed', requeued: pending.length };
    }
    async cancel(workspaceId, id) {
        await this.findOne(workspaceId, id);
        await this.campaigns.update(id, { status: 'cancelled' });
        await this.recipients.update({ campaignId: id, status: (0, typeorm_2.In)(['pending', 'queued']) }, { status: 'skipped' });
        return { message: 'Campaign cancelled' };
    }
    /** Test send — never touches campaign_recipients, tracking, or statistics. */
    async sendTest(workspaceId, id, recipients) {
        const c = await this.findOne(workspaceId, id);
        if (!c.htmlContent)
            throw new common_1.BadRequestException('Add email content before sending a test');
        const sender = c.senderIdentityId
            ? await this.sendersSvc.assertSendable(workspaceId, c.senderIdentityId)
            : null;
        const sample = {
            id: 'test', email: recipients[0], firstName: 'FirstName', lastName: 'LastName',
            customAttributes: { company: 'Acme', city: 'Delhi' },
        };
        const html = (0, renderer_1.renderMergeTags)(c.htmlContent, sample);
        const subject = `[TEST] ${(0, renderer_1.renderMergeTags)(c.subject || c.name, sample)}`;
        const results = [];
        for (const to of recipients.slice(0, 5)) {
            const res = await this.email.send({
                workspaceId, to, subject, html, text: (0, renderer_1.htmlToText)(html),
                fromName: sender?.fromName || 'MailFlow',
                fromEmail: sender?.fromEmail || this.config.get('email.from'),
                replyTo: sender?.replyToEmail,
            });
            results.push({ to, sent: res.accepted, error: res.error });
        }
        return { results };
    }
    async recipients_(workspaceId, id, q) {
        const qb = this.recipients.createQueryBuilder('r')
            .where('r.workspace_id = :workspaceId', { workspaceId })
            .andWhere('r.campaign_id = :id', { id });
        if (q.status)
            qb.andWhere('r.status = :status', { status: q.status });
        if (q.search)
            qb.andWhere('r.email LIKE :s', { s: `%${q.search}%` });
        qb.orderBy('r.created_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_dto_1.paginate)(data, total, q.page, q.limit);
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CampaignRecipient)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.EmailTemplate)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.SenderIdentity)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Suppression)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        segments_service_1.SegmentsService,
        senders_service_1.SendersService,
        email_service_1.EmailService,
        queue_service_1.QueueService,
        config_1.ConfigService,
        typeorm_2.DataSource,
        billing_service_1.BillingService])
], CampaignsService);
