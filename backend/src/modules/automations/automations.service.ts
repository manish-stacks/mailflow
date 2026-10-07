import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Automation, AutomationStep, ContactList } from '@/database/entities';
import { EmailService } from '@/integrations/email/email.service';
import { applyUnsubscribe, htmlToText, renderMergeTags, unsubscribeUrl } from '@/integrations/email/renderer';
import { signToken } from '@/common/tokens';
import { BillingService } from '@/modules/billing/billing.service';
import { SendersService } from '@/modules/senders/senders.service';
import { SaveAutomationDto } from './dto';

const LEASE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

@Injectable()
export class AutomationsService {
  private logger = new Logger('Automations');
  private ticking = false;

  constructor(
    @InjectRepository(Automation) private autos: Repository<Automation>,
    @InjectRepository(AutomationStep) private steps: Repository<AutomationStep>,
    @InjectRepository(ContactList) private lists: Repository<ContactList>,
    private db: DataSource,
    private email: EmailService,
    private billing: BillingService,
    private senders: SendersService,
    private config: ConfigService,
  ) {}

  /* ------------------------------------------------------------ CRUD */

  async findAll(ws: string) {
    const rows = await this.autos.find({ where: { workspaceId: ws }, order: { createdAt: 'DESC' } });
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const stepCounts = await this.db.query(`SELECT automation_id AS id, COUNT(*) AS n FROM automation_steps WHERE automation_id IN (?) GROUP BY automation_id`, [ids]);
    const enr = await this.db.query(
      `SELECT automation_id AS id, COUNT(*) AS enrolled, SUM(status='completed') AS completed, SUM(sent_count) AS sent
         FROM automation_enrollments WHERE automation_id IN (?) GROUP BY automation_id`, [ids]);
    return rows.map((r) => ({
      ...r,
      stepCount: Number(stepCounts.find((x: any) => x.id === r.id)?.n || 0),
      stats: (() => { const e = enr.find((x: any) => x.id === r.id); return { enrolled: Number(e?.enrolled || 0), completed: Number(e?.completed || 0), sent: Number(e?.sent || 0) }; })(),
    }));
  }

  async findOne(ws: string, id: string) {
    const a = await this.autos.findOne({ where: { id, workspaceId: ws } });
    if (!a) throw new NotFoundException('Automation not found');
    const steps = await this.steps.find({ where: { automationId: id }, order: { position: 'ASC' } });
    return { ...a, steps };
  }

  async stats(ws: string, id: string) {
    await this.findOne(ws, id);
    const [row] = await this.db.query(
      `SELECT COUNT(*) AS enrolled, SUM(status='active') AS active, SUM(status='completed') AS completed,
              SUM(status='cancelled') AS cancelled, COALESCE(SUM(sent_count),0) AS sent
         FROM automation_enrollments WHERE automation_id = ? AND workspace_id = ?`, [id, ws]);
    const num = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v || 0)])) as Record<string, number>;
    const [ev] = await this.db.query(
      `SELECT COUNT(DISTINCT CASE WHEN event_type='opened' THEN enrollment_id END) AS uniqueOpens,
              COUNT(DISTINCT CASE WHEN event_type='clicked' THEN enrollment_id END) AS uniqueClicks
         FROM automation_events WHERE automation_id = ?`, [id]);
    const perStep = await this.db.query(
      `SELECT step_position AS pos, COUNT(DISTINCT CASE WHEN event_type='opened' THEN enrollment_id END) AS opens,
              COUNT(DISTINCT CASE WHEN event_type='clicked' THEN enrollment_id END) AS clicks
         FROM automation_events WHERE automation_id = ? GROUP BY step_position`, [id]);
    const sentPer = await this.db.query(
      `SELECT p.position AS pos, COUNT(e.id) AS sent FROM automation_steps p
         LEFT JOIN automation_enrollments e ON e.automation_id = p.automation_id AND e.sent_count > p.position
        WHERE p.automation_id = ? GROUP BY p.position ORDER BY p.position`, [id]);
    const steps = sentPer.map((s: any) => {
      const x = perStep.find((r: any) => Number(r.pos) === Number(s.pos));
      const sent = Number(s.sent || 0), opens = Number(x?.opens || 0), clicks = Number(x?.clicks || 0);
      return { position: Number(s.pos), sent, opens, clicks, openRate: sent ? +(opens / sent * 100).toFixed(1) : 0, clickRate: sent ? +(clicks / sent * 100).toFixed(1) : 0 };
    });
    return { ...num, uniqueOpens: Number(ev?.uniqueOpens || 0), uniqueClicks: Number(ev?.uniqueClicks || 0), steps };
  }

  private async validateRefs(ws: string, dto: SaveAutomationDto) {
    if (dto.listId && !(await this.lists.findOne({ where: { id: dto.listId, workspaceId: ws } }))) throw new BadRequestException('Selected list not found');
    if (dto.senderIdentityId) await this.senders.findOne(ws, dto.senderIdentityId);
  }

  async create(ws: string, userId: string, dto: SaveAutomationDto) {
    await this.validateRefs(ws, dto);
    const a = await this.autos.save(this.autos.create({
      workspaceId: ws, createdBy: userId, name: dto.name || 'Untitled automation',
      triggerType: dto.triggerType || 'list_join', listId: dto.listId ?? null, senderIdentityId: dto.senderIdentityId ?? null, status: 'draft',
    } as any) as any) as unknown as Automation;
    await this.replaceSteps(a.id, dto.steps?.length ? dto.steps : [{ delayMinutes: 0, subject: 'Welcome!', htmlContent: '' }]);
    return this.findOne(ws, a.id);
  }

  async update(ws: string, id: string, dto: SaveAutomationDto) {
    const a = await this.findOne(ws, id);
    await this.validateRefs(ws, dto);
    const { steps, ...rest } = dto;
    const patch: any = {};
    for (const k of ['name', 'triggerType', 'listId', 'senderIdentityId'] as const) if (k in rest && (rest as any)[k] !== undefined) patch[k] = (rest as any)[k];
    if (Object.keys(patch).length) await this.autos.update(id, patch);
    if (steps) await this.replaceSteps(id, steps);
    if (a.status === 'active') await this.assertReady(ws, id); // never leave a live automation half-edited
    return this.findOne(ws, id);
  }

  private async replaceSteps(automationId: string, list: SaveAutomationDto['steps']) {
    await this.db.transaction(async (m) => {
      await m.delete(AutomationStep, { automationId });
      await m.save(AutomationStep, list!.map((s, i) => m.create(AutomationStep, {
        automationId, position: i, delayMinutes: s.delayMinutes, subject: s.subject, previewText: s.previewText, htmlContent: s.htmlContent,
      })));
    });
  }

  async remove(ws: string, id: string) {
    await this.findOne(ws, id);
    await this.autos.update(id, { status: 'paused' });
    await this.autos.softDelete(id);
    return { message: 'Automation deleted' };
  }

  /* -------------------------------------------------------- lifecycle */

  private async assertReady(ws: string, id: string) {
    const a = await this.findOne(ws, id);
    if (!a.steps.length) throw new BadRequestException('Add at least one email step');
    a.steps.forEach((s, i) => {
      if (!s.subject?.trim()) throw new BadRequestException(`Step ${i + 1} needs a subject`);
      if (!s.htmlContent?.trim()) throw new BadRequestException(`Step ${i + 1} needs email content`);
    });
    if (!a.senderIdentityId) throw new BadRequestException('Choose a sender identity');
    await this.senders.assertSendable(ws, a.senderIdentityId);
    if (a.triggerType === 'list_join' && !a.listId) throw new BadRequestException('Choose the list that triggers this automation');
    return a;
  }

  async activate(ws: string, id: string) {
    const a = await this.assertReady(ws, id);
    // activated_at uses the DB clock so "joined after activation" compares like with like.
    if (a.status === 'draft') await this.db.query(`UPDATE automations SET status='active', activated_at = NOW() WHERE id = ?`, [id]);
    else await this.autos.update(id, { status: 'active' });
    return this.findOne(ws, id);
  }

  async pause(ws: string, id: string) {
    await this.findOne(ws, id);
    await this.autos.update(id, { status: 'paused' });
    return this.findOne(ws, id);
  }

  /* ----------------------------------------------------------- runner */

  /** Called every minute by the worker. Safe to run on several workers at once (rows are claimed atomically). */
  async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.enrollNew();
      await this.processDue();
    } finally { this.ticking = false; }
  }

  /** Only contacts who joined AFTER activation are enrolled, so turning an automation on never mass-mails an existing list. */
  private async enrollNew() {
    const active: Automation[] = await this.autos.find({ where: { status: 'active' } });
    for (const a of active) {
      const [first] = await this.steps.find({ where: { automationId: a.id }, order: { position: 'ASC' }, take: 1 });
      if (!first) continue;
      const base = `FROM contacts c %JOIN% WHERE c.workspace_id = ? AND c.status = 'active' AND c.subscribed = 1
         AND NOT EXISTS (SELECT 1 FROM suppressions s WHERE s.workspace_id = c.workspace_id AND s.email = c.email) %COND%`;
      const insert = `INSERT IGNORE INTO automation_enrollments (id, workspace_id, automation_id, contact_id, next_step, next_run_at, status)
         SELECT UUID(), c.workspace_id, ?, c.id, 0, NOW() + INTERVAL ? MINUTE, 'active' `;
      if (a.triggerType === 'list_join' && a.listId) {
        await this.db.query(insert + base.replace('%JOIN%', 'JOIN contact_list_members m ON m.contact_id = c.id').replace('%COND%', 'AND m.list_id = ? AND m.created_at >= (SELECT activated_at FROM automations WHERE id = ?)'),
          [a.id, first.delayMinutes, a.workspaceId, a.listId, a.id]);
      } else if (a.triggerType === 'contact_created') {
        await this.db.query(insert + base.replace('%JOIN%', '').replace('%COND%', 'AND c.created_at >= (SELECT activated_at FROM automations WHERE id = ?)'),
          [a.id, first.delayMinutes, a.workspaceId, a.id]);
      }
    }
  }

  private async processDue() {
    const limit = Math.min(200, Number(this.config.get('email.ratePerMinute')) || 200);
    const due: { id: string }[] = await this.db.query(
      `SELECT e.id FROM automation_enrollments e JOIN automations a ON a.id = e.automation_id AND a.status = 'active' AND a.deleted_at IS NULL
        WHERE e.status = 'active' AND e.next_run_at <= NOW() ORDER BY e.next_run_at LIMIT ?`, [limit]);
    for (let i = 0; i < due.length; i += 5) await Promise.all(due.slice(i, i + 5).map((d) => this.runOne(d.id).catch((e) => this.logger.error(`enrollment ${d.id}: ${e.message}`))));
  }

  private async runOne(enrollmentId: string) {
    // Claim with a lease: other workers skip it, and if this worker dies it becomes due again after LEASE_MINUTES.
    const claim: any = await this.db.query(
      `UPDATE automation_enrollments SET next_run_at = NOW() + INTERVAL ${LEASE_MINUTES} MINUTE WHERE id = ? AND status = 'active' AND next_run_at <= NOW()`, [enrollmentId]);
    if (!claim.affectedRows) return;

    const [e] = await this.db.query(`SELECT * FROM automation_enrollments WHERE id = ?`, [enrollmentId]);
    const a = await this.autos.findOne({ where: { id: e.automation_id } });
    const stepList = await this.steps.find({ where: { automationId: e.automation_id }, order: { position: 'ASC' } });
    const step = stepList[e.next_step];
    const cancel = (reason: string) => this.db.query(`UPDATE automation_enrollments SET status='cancelled', last_error=? WHERE id=?`, [reason.slice(0, 480), enrollmentId]);
    if (!a || !step) return cancel('Automation or step no longer exists');

    const [c] = await this.db.query(
      `SELECT c.id, c.email, c.first_name, c.last_name, c.custom_attributes, c.status, c.subscribed,
              EXISTS (SELECT 1 FROM suppressions s WHERE s.workspace_id = c.workspace_id AND s.email = c.email) AS suppressed
         FROM contacts c WHERE c.id = ?`, [e.contact_id]);
    if (!c || c.status !== 'active' || !c.subscribed || Number(c.suppressed)) return cancel('Contact is no longer eligible');

    try { await this.billing.assertQuota(a.workspaceId, 'emails', 1); } catch (err: any) { return this.fail(enrollmentId, err.message, true); }

    const sender = a.senderIdentityId ? await this.senders.findOne(a.workspaceId, a.senderIdentityId).catch(() => null) : null;
    let attrs: any = c.custom_attributes;
    if (typeof attrs === 'string') { try { attrs = JSON.parse(attrs); } catch { attrs = {}; } }
    const vars = { id: c.id, email: c.email, firstName: c.first_name, lastName: c.last_name, customAttributes: attrs || {} };
    const unsub = unsubscribeUrl({
      secret: this.config.get('trackingSecret'), appBaseUrl: this.config.get('appBaseUrl'),
      recipientId: enrollmentId, workspaceId: a.workspaceId, contactId: c.id,
    });
    const html = this.addTracking(applyUnsubscribe(this.trackLinks(renderMergeTags(step.htmlContent || '', vars), a.id, enrollmentId, e.next_step), unsub), a.id, enrollmentId, e.next_step);

    const res = await this.email.send({
      workspaceId: a.workspaceId, to: c.email, subject: renderMergeTags(step.subject, vars), html, text: htmlToText(html),
      fromName: sender?.fromName || 'MailFlow', fromEmail: sender?.fromEmail || this.config.get('email.from'), replyTo: sender?.replyToEmail,
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', 'X-Automation-Id': a.id },
    });
    if (!res.accepted) return this.fail(enrollmentId, res.error || 'Send failed', !!res.retryable);

    await this.billing.increment(a.workspaceId, 'emailsSent', 1);
    const nextStep = stepList[e.next_step + 1];
    if (nextStep) {
      await this.db.query(
        `UPDATE automation_enrollments SET next_step = next_step + 1, sent_count = sent_count + 1, attempts = 0, last_error = NULL,
                next_run_at = NOW() + INTERVAL ? MINUTE WHERE id = ?`, [nextStep.delayMinutes, enrollmentId]);
    } else {
      await this.db.query(`UPDATE automation_enrollments SET status='completed', sent_count = sent_count + 1, attempts = 0, last_error = NULL WHERE id = ?`, [enrollmentId]);
    }
  }

  /** Rewrites http(s) links to signed click-tracking URLs (the destination is part of the signed token). */
  private trackLinks(html: string, automationId: string, enrollmentId: string, pos: number) {
    const secret = this.config.get('trackingSecret'); const base = this.config.get('trackingBaseUrl');
    return html.replace(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi, (m, url: string) => {
      if (url.includes('/tracking/') || url.includes('/unsubscribe/') || url.length > 1500) return m;
      return `href="${base}/tracking/click/${signToken({ a: automationId, e: enrollmentId, p: pos, u: url.replace(/&amp;/g, '&') }, secret)}"`;
    });
  }

  private addTracking(html: string, automationId: string, enrollmentId: string, pos: number) {
    const token = signToken({ a: automationId, e: enrollmentId, p: pos }, this.config.get('trackingSecret'));
    const pixel = `<img src="${this.config.get('trackingBaseUrl')}/tracking/open/${token}" width="1" height="1" alt="" style="display:block;border:0;" />`;
    return html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : html + pixel;
  }

  private async fail(enrollmentId: string, error: string, retryable: boolean) {
    const [e] = await this.db.query(`SELECT attempts FROM automation_enrollments WHERE id = ?`, [enrollmentId]);
    const attempts = Number(e?.attempts || 0) + 1;
    if (!retryable || attempts >= MAX_ATTEMPTS) {
      await this.db.query(`UPDATE automation_enrollments SET status='cancelled', attempts=?, last_error=? WHERE id=?`, [attempts, error.slice(0, 480), enrollmentId]);
    } else {
      // keep the lease already set by runOne → retried after LEASE_MINUTES
      await this.db.query(`UPDATE automation_enrollments SET attempts=?, last_error=? WHERE id=?`, [attempts, error.slice(0, 480), enrollmentId]);
    }
  }
}
