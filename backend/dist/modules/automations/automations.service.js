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
exports.AutomationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const email_service_1 = require("../../integrations/email/email.service");
const renderer_1 = require("../../integrations/email/renderer");
const tokens_1 = require("../../common/tokens");
const billing_service_1 = require("../billing/billing.service");
const senders_service_1 = require("../senders/senders.service");
const LEASE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
let AutomationsService = class AutomationsService {
    autos;
    steps;
    lists;
    db;
    email;
    billing;
    senders;
    config;
    logger = new common_1.Logger('Automations');
    ticking = false;
    constructor(autos, steps, lists, db, email, billing, senders, config) {
        this.autos = autos;
        this.steps = steps;
        this.lists = lists;
        this.db = db;
        this.email = email;
        this.billing = billing;
        this.senders = senders;
        this.config = config;
    }
    /* ------------------------------------------------------------ CRUD */
    async findAll(ws) {
        const rows = await this.autos.find({ where: { workspaceId: ws }, order: { createdAt: 'DESC' } });
        if (!rows.length)
            return [];
        const ids = rows.map((r) => r.id);
        const stepCounts = await this.db.query(`SELECT automation_id AS id, COUNT(*) AS n FROM automation_steps WHERE automation_id IN (?) GROUP BY automation_id`, [ids]);
        const enr = await this.db.query(`SELECT automation_id AS id, COUNT(*) AS enrolled, SUM(status='completed') AS completed, SUM(sent_count) AS sent
         FROM automation_enrollments WHERE automation_id IN (?) GROUP BY automation_id`, [ids]);
        return rows.map((r) => ({
            ...r,
            stepCount: Number(stepCounts.find((x) => x.id === r.id)?.n || 0),
            stats: (() => { const e = enr.find((x) => x.id === r.id); return { enrolled: Number(e?.enrolled || 0), completed: Number(e?.completed || 0), sent: Number(e?.sent || 0) }; })(),
        }));
    }
    async findOne(ws, id) {
        const a = await this.autos.findOne({ where: { id, workspaceId: ws } });
        if (!a)
            throw new common_1.NotFoundException('Automation not found');
        const steps = await this.steps.find({ where: { automationId: id }, order: { position: 'ASC' } });
        return { ...a, steps };
    }
    async stats(ws, id) {
        await this.findOne(ws, id);
        const [row] = await this.db.query(`SELECT COUNT(*) AS enrolled, SUM(status='active') AS active, SUM(status='completed') AS completed,
              SUM(status='cancelled') AS cancelled, COALESCE(SUM(sent_count),0) AS sent
         FROM automation_enrollments WHERE automation_id = ? AND workspace_id = ?`, [id, ws]);
        const num = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v || 0)]));
        const [ev] = await this.db.query(`SELECT COUNT(DISTINCT CASE WHEN event_type='opened' THEN enrollment_id END) AS uniqueOpens,
              COUNT(DISTINCT CASE WHEN event_type='clicked' THEN enrollment_id END) AS uniqueClicks
         FROM automation_events WHERE automation_id = ?`, [id]);
        const perStep = await this.db.query(`SELECT step_position AS pos, COUNT(DISTINCT CASE WHEN event_type='opened' THEN enrollment_id END) AS opens,
              COUNT(DISTINCT CASE WHEN event_type='clicked' THEN enrollment_id END) AS clicks
         FROM automation_events WHERE automation_id = ? GROUP BY step_position`, [id]);
        const sentPer = await this.db.query(`SELECT p.position AS pos, COUNT(e.id) AS sent FROM automation_steps p
         LEFT JOIN automation_enrollments e ON e.automation_id = p.automation_id AND e.sent_count > p.position
        WHERE p.automation_id = ? GROUP BY p.position ORDER BY p.position`, [id]);
        const steps = sentPer.map((s) => {
            const x = perStep.find((r) => Number(r.pos) === Number(s.pos));
            const sent = Number(s.sent || 0), opens = Number(x?.opens || 0), clicks = Number(x?.clicks || 0);
            return { position: Number(s.pos), sent, opens, clicks, openRate: sent ? +(opens / sent * 100).toFixed(1) : 0, clickRate: sent ? +(clicks / sent * 100).toFixed(1) : 0 };
        });
        return { ...num, uniqueOpens: Number(ev?.uniqueOpens || 0), uniqueClicks: Number(ev?.uniqueClicks || 0), steps };
    }
    async validateRefs(ws, dto) {
        if (dto.listId && !(await this.lists.findOne({ where: { id: dto.listId, workspaceId: ws } })))
            throw new common_1.BadRequestException('Selected list not found');
        if (dto.senderIdentityId)
            await this.senders.findOne(ws, dto.senderIdentityId);
    }
    async create(ws, userId, dto) {
        await this.validateRefs(ws, dto);
        const a = await this.autos.save(this.autos.create({
            workspaceId: ws, createdBy: userId, name: dto.name || 'Untitled automation',
            triggerType: dto.triggerType || 'list_join', listId: dto.listId ?? null, senderIdentityId: dto.senderIdentityId ?? null, status: 'draft',
        }));
        await this.replaceSteps(a.id, dto.steps?.length ? dto.steps : [{ delayMinutes: 0, subject: 'Welcome!', htmlContent: '' }]);
        return this.findOne(ws, a.id);
    }
    async update(ws, id, dto) {
        const a = await this.findOne(ws, id);
        await this.validateRefs(ws, dto);
        const { steps, ...rest } = dto;
        const patch = {};
        for (const k of ['name', 'triggerType', 'listId', 'senderIdentityId'])
            if (k in rest && rest[k] !== undefined)
                patch[k] = rest[k];
        if (Object.keys(patch).length)
            await this.autos.update(id, patch);
        if (steps)
            await this.replaceSteps(id, steps);
        if (a.status === 'active')
            await this.assertReady(ws, id); // never leave a live automation half-edited
        return this.findOne(ws, id);
    }
    async replaceSteps(automationId, list) {
        await this.db.transaction(async (m) => {
            await m.delete(entities_1.AutomationStep, { automationId });
            await m.save(entities_1.AutomationStep, list.map((s, i) => m.create(entities_1.AutomationStep, {
                automationId, position: i, delayMinutes: s.delayMinutes, subject: s.subject, previewText: s.previewText, htmlContent: s.htmlContent,
            })));
        });
    }
    async remove(ws, id) {
        await this.findOne(ws, id);
        await this.autos.update(id, { status: 'paused' });
        await this.autos.softDelete(id);
        return { message: 'Automation deleted' };
    }
    /* -------------------------------------------------------- lifecycle */
    async assertReady(ws, id) {
        const a = await this.findOne(ws, id);
        if (!a.steps.length)
            throw new common_1.BadRequestException('Add at least one email step');
        a.steps.forEach((s, i) => {
            if (!s.subject?.trim())
                throw new common_1.BadRequestException(`Step ${i + 1} needs a subject`);
            if (!s.htmlContent?.trim())
                throw new common_1.BadRequestException(`Step ${i + 1} needs email content`);
        });
        if (!a.senderIdentityId)
            throw new common_1.BadRequestException('Choose a sender identity');
        await this.senders.assertSendable(ws, a.senderIdentityId);
        if (a.triggerType === 'list_join' && !a.listId)
            throw new common_1.BadRequestException('Choose the list that triggers this automation');
        return a;
    }
    async activate(ws, id) {
        const a = await this.assertReady(ws, id);
        // activated_at uses the DB clock so "joined after activation" compares like with like.
        if (a.status === 'draft')
            await this.db.query(`UPDATE automations SET status='active', activated_at = NOW() WHERE id = ?`, [id]);
        else
            await this.autos.update(id, { status: 'active' });
        return this.findOne(ws, id);
    }
    async pause(ws, id) {
        await this.findOne(ws, id);
        await this.autos.update(id, { status: 'paused' });
        return this.findOne(ws, id);
    }
    /* ----------------------------------------------------------- runner */
    /** Called every minute by the worker. Safe to run on several workers at once (rows are claimed atomically). */
    async tick() {
        if (this.ticking)
            return;
        this.ticking = true;
        try {
            await this.enrollNew();
            await this.processDue();
        }
        finally {
            this.ticking = false;
        }
    }
    /** Only contacts who joined AFTER activation are enrolled, so turning an automation on never mass-mails an existing list. */
    async enrollNew() {
        const active = await this.autos.find({ where: { status: 'active' } });
        for (const a of active) {
            const [first] = await this.steps.find({ where: { automationId: a.id }, order: { position: 'ASC' }, take: 1 });
            if (!first)
                continue;
            const base = `FROM contacts c %JOIN% WHERE c.workspace_id = ? AND c.status = 'active' AND c.subscribed = 1
         AND NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.workspace_id = c.workspace_id AND s.email = c.email) %COND%`;
            const insert = `INSERT IGNORE INTO automation_enrollments (id, workspace_id, automation_id, contact_id, next_step, next_run_at, status)
         SELECT UUID(), c.workspace_id, ?, c.id, 0, NOW() + INTERVAL ? MINUTE, 'active' `;
            if (a.triggerType === 'list_join' && a.listId) {
                await this.db.query(insert + base.replace('%JOIN%', 'JOIN contact_list_members m ON m.contact_id = c.id').replace('%COND%', 'AND m.list_id = ? AND m.created_at >= (SELECT activated_at FROM automations WHERE id = ?)'), [a.id, first.delayMinutes, a.workspaceId, a.listId, a.id]);
            }
            else if (a.triggerType === 'contact_created') {
                await this.db.query(insert + base.replace('%JOIN%', '').replace('%COND%', 'AND c.created_at >= (SELECT activated_at FROM automations WHERE id = ?)'), [a.id, first.delayMinutes, a.workspaceId, a.id]);
            }
        }
    }
    async processDue() {
        const limit = Math.min(200, Number(this.config.get('email.ratePerMinute')) || 200);
        const due = await this.db.query(`SELECT e.id FROM automation_enrollments e JOIN automations a ON a.id = e.automation_id AND a.status = 'active' AND a.deleted_at IS NULL
        WHERE e.status = 'active' AND e.next_run_at <= NOW() ORDER BY e.next_run_at LIMIT ?`, [limit]);
        for (let i = 0; i < due.length; i += 5)
            await Promise.all(due.slice(i, i + 5).map((d) => this.runOne(d.id).catch((e) => this.logger.error(`enrollment ${d.id}: ${e.message}`))));
    }
    async runOne(enrollmentId) {
        // Claim with a lease: other workers skip it, and if this worker dies it becomes due again after LEASE_MINUTES.
        const claim = await this.db.query(`UPDATE automation_enrollments SET next_run_at = NOW() + INTERVAL ${LEASE_MINUTES} MINUTE WHERE id = ? AND status = 'active' AND next_run_at <= NOW()`, [enrollmentId]);
        if (!claim.affectedRows)
            return;
        const [e] = await this.db.query(`SELECT * FROM automation_enrollments WHERE id = ?`, [enrollmentId]);
        const a = await this.autos.findOne({ where: { id: e.automation_id } });
        const stepList = await this.steps.find({ where: { automationId: e.automation_id }, order: { position: 'ASC' } });
        const step = stepList[e.next_step];
        const cancel = (reason) => this.db.query(`UPDATE automation_enrollments SET status='cancelled', last_error=? WHERE id=?`, [reason.slice(0, 480), enrollmentId]);
        if (!a || !step)
            return cancel('Automation or step no longer exists');
        const [c] = await this.db.query(`SELECT c.id, c.email, c.first_name, c.last_name, c.custom_attributes, c.status, c.subscribed,
              EXISTS (SELECT 1 FROM suppressions s WHERE s.workspace_id = c.workspace_id AND s.email = c.email) AS suppressed
         FROM contacts c WHERE c.id = ?`, [e.contact_id]);
        if (!c || c.status !== 'active' || !c.subscribed || Number(c.suppressed))
            return cancel('Contact is no longer eligible');
        try {
            await this.billing.assertQuota(a.workspaceId, 'emails', 1);
        }
        catch (err) {
            return this.fail(enrollmentId, err.message, true);
        }
        const sender = a.senderIdentityId ? await this.senders.findOne(a.workspaceId, a.senderIdentityId).catch(() => null) : null;
        let attrs = c.custom_attributes;
        if (typeof attrs === 'string') {
            try {
                attrs = JSON.parse(attrs);
            }
            catch {
                attrs = {};
            }
        }
        const vars = { id: c.id, email: c.email, firstName: c.first_name, lastName: c.last_name, customAttributes: attrs || {} };
        const unsub = (0, renderer_1.unsubscribeUrl)({
            secret: this.config.get('trackingSecret'), appBaseUrl: this.config.get('appBaseUrl'),
            recipientId: enrollmentId, workspaceId: a.workspaceId, contactId: c.id,
        });
        const html = this.addTracking((0, renderer_1.applyUnsubscribe)(this.trackLinks((0, renderer_1.renderMergeTags)(step.htmlContent || '', vars), a.id, enrollmentId, e.next_step), unsub), a.id, enrollmentId, e.next_step);
        const res = await this.email.send({
            workspaceId: a.workspaceId, to: c.email, subject: (0, renderer_1.renderMergeTags)(step.subject, vars), html, text: (0, renderer_1.htmlToText)(html),
            fromName: sender?.fromName || 'MailFlow', fromEmail: sender?.fromEmail || this.config.get('email.from'), replyTo: sender?.replyToEmail,
            headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', 'X-Automation-Id': a.id },
        });
        if (!res.accepted)
            return this.fail(enrollmentId, res.error || 'Send failed', !!res.retryable);
        await this.billing.increment(a.workspaceId, 'emailsSent', 1);
        const nextStep = stepList[e.next_step + 1];
        if (nextStep) {
            await this.db.query(`UPDATE automation_enrollments SET next_step = next_step + 1, sent_count = sent_count + 1, attempts = 0, last_error = NULL,
                next_run_at = NOW() + INTERVAL ? MINUTE WHERE id = ?`, [nextStep.delayMinutes, enrollmentId]);
        }
        else {
            await this.db.query(`UPDATE automation_enrollments SET status='completed', sent_count = sent_count + 1, attempts = 0, last_error = NULL WHERE id = ?`, [enrollmentId]);
        }
    }
    /** Rewrites http(s) links to signed click-tracking URLs (the destination is part of the signed token). */
    trackLinks(html, automationId, enrollmentId, pos) {
        const secret = this.config.get('trackingSecret');
        const base = this.config.get('trackingBaseUrl');
        return html.replace(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi, (m, url) => {
            if (url.includes('/tracking/') || url.includes('/unsubscribe/') || url.length > 1500)
                return m;
            return `href="${base}/tracking/click/${(0, tokens_1.signToken)({ a: automationId, e: enrollmentId, p: pos, u: url.replace(/&amp;/g, '&') }, secret)}"`;
        });
    }
    addTracking(html, automationId, enrollmentId, pos) {
        const token = (0, tokens_1.signToken)({ a: automationId, e: enrollmentId, p: pos }, this.config.get('trackingSecret'));
        const pixel = `<img src="${this.config.get('trackingBaseUrl')}/tracking/open/${token}" width="1" height="1" alt="" style="display:block;border:0;" />`;
        return html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : html + pixel;
    }
    async fail(enrollmentId, error, retryable) {
        const [e] = await this.db.query(`SELECT attempts FROM automation_enrollments WHERE id = ?`, [enrollmentId]);
        const attempts = Number(e?.attempts || 0) + 1;
        if (!retryable || attempts >= MAX_ATTEMPTS) {
            await this.db.query(`UPDATE automation_enrollments SET status='cancelled', attempts=?, last_error=? WHERE id=?`, [attempts, error.slice(0, 480), enrollmentId]);
        }
        else {
            // keep the lease already set by runOne → retried after LEASE_MINUTES
            await this.db.query(`UPDATE automation_enrollments SET attempts=?, last_error=? WHERE id=?`, [attempts, error.slice(0, 480), enrollmentId]);
        }
    }
};
exports.AutomationsService = AutomationsService;
exports.AutomationsService = AutomationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Automation)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.AutomationStep)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ContactList)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        email_service_1.EmailService,
        billing_service_1.BillingService,
        senders_service_1.SendersService,
        config_1.ConfigService])
], AutomationsService);
