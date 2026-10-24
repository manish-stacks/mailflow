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
var CampaignDispatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignDispatchService = void 0;
const ab_util_1 = require("./ab.util");
const common_1 = require("@nestjs/common");
const billing_service_1 = require("../billing/billing.service");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const email_service_1 = require("../../integrations/email/email.service");
const renderer_1 = require("../../integrations/email/renderer");
const queue_service_1 = require("../../queues/queue.service");
const queue_constants_1 = require("../../queues/queue.constants");
const suppression_service_1 = require("../suppression/suppression.service");
const campaigns_service_1 = require("./campaigns.service");
/**
 * The part of campaign sending that runs inside workers.
 * Preparation materialises recipients; dispatch renders and sends one email.
 */
let CampaignDispatchService = CampaignDispatchService_1 = class CampaignDispatchService {
    campaigns;
    recipients;
    events;
    contacts;
    senders;
    links;
    campaignsSvc;
    email;
    queue;
    config;
    dataSource;
    billing;
    suppression;
    logger = new common_1.Logger(CampaignDispatchService_1.name);
    constructor(campaigns, recipients, events, contacts, senders, links, campaignsSvc, email, queue, config, dataSource, billing, suppression) {
        this.campaigns = campaigns;
        this.recipients = recipients;
        this.events = events;
        this.contacts = contacts;
        this.senders = senders;
        this.links = links;
        this.campaignsSvc = campaignsSvc;
        this.email = email;
        this.queue = queue;
        this.config = config;
        this.dataSource = dataSource;
        this.billing = billing;
        this.suppression = suppression;
    }
    /** Tiny in-process TTL cache so a 10k-email campaign doesn't re-read the same rows 10k times. */
    cache = new Map();
    async cached(key, ttlMs, fn) {
        const hit = this.cache.get(key);
        if (hit && hit.exp > Date.now())
            return hit.v;
        const v = await fn();
        this.cache.set(key, { exp: Date.now() + ttlMs, v });
        if (this.cache.size > 500)
            for (const [k, e] of this.cache)
                if (e.exp < Date.now())
                    this.cache.delete(k);
        return v;
    }
    /** Queue: campaign-preparation */
    async prepare(campaignId, workspaceId) {
        const campaign = await this.campaigns.findOne({ where: { id: campaignId, workspaceId } });
        if (!campaign)
            return;
        if (!['preparing', 'scheduled', 'paused'].includes(campaign.status)) {
            this.logger.warn(`Campaign ${campaignId} is ${campaign.status}; preparation aborted`);
            return;
        }
        // Snapshot trackable links so click URLs stay stable for the campaign's life.
        const urls = (0, renderer_1.extractLinks)(campaign.htmlContent || '');
        for (const url of urls) {
            await this.links.createQueryBuilder().insert()
                .values({ workspaceId, campaignId, url, urlHash: (0, renderer_1.hashUrl)(url) }).orIgnore().execute();
        }
        const { query } = await this.campaignsSvc.resolveAudience(workspaceId, campaign);
        const batchSize = 2000;
        let offset = 0;
        let total = 0;
        for (;;) {
            const batch = await query.clone().orderBy('c.id', 'ASC').skip(offset).take(batchSize).getMany();
            if (!batch.length)
                break;
            await this.recipients.createQueryBuilder().insert()
                .values(batch.map((c) => ({
                workspaceId, campaignId, contactId: c.id, email: c.email, status: 'pending',
            })))
                .orIgnore().execute();
            const saved = await this.recipients.find({
                where: { campaignId, contactId: (0, typeorm_2.In)(batch.map((b) => b.id)) },
                select: ['id'],
            }).catch(() => []);
            const rows = saved.length ? saved : await this.dataSource.query(`SELECT id FROM campaign_recipients WHERE campaign_id = ? AND status = 'pending' LIMIT ? OFFSET ?`, [campaignId, batchSize, offset]);
            // Auto-winner A/B: only the test group is queued now; the rest wait (status 'pending') for resolveAbWinners().
            const abT = (0, ab_util_1.abThreshold)(campaign.settings);
            const toQueue = abT === null ? rows : rows.filter((r) => (0, ab_util_1.inTestGroup)(r.id, abT));
            if (toQueue.length) {
                await this.queue.addBulk(queue_constants_1.QUEUES.EMAIL_SENDING, toQueue.map((r) => ({
                    name: 'send', data: { recipientId: r.id, campaignId, workspaceId },
                })));
                await this.recipients.createQueryBuilder().update()
                    .set({ status: 'queued' }).whereInIds(toQueue.map((r) => r.id)).execute();
            }
            total += batch.length;
            offset += batchSize;
        }
        await this.campaigns.update(campaignId, { status: 'sending', totalRecipients: total });
        this.logger.log(`Campaign ${campaignId} prepared with ${total} recipients`);
        // Tiny campaigns can finish sending before prepare() flips the status — close them out here.
        await this.maybeComplete(campaignId);
    }
    /** Queue: email-sending. Returns false when the job should be retried. */
    async dispatch(recipientId, campaignId, workspaceId) {
        const recipient = await this.recipients.findOne({ where: { id: recipientId, workspaceId } });
        if (!recipient || ['sent', 'delivered', 'skipped'].includes(recipient.status))
            return true;
        const campaign = await this.cached(`c:${campaignId}`, 3000, () => this.campaigns.findOne({ where: { id: campaignId, workspaceId } }));
        if (!campaign)
            return true;
        if (['paused', 'cancelled'].includes(campaign.status))
            return true;
        // Atomic claim: two workers (or a duplicate job after pause/resume) can never send the same recipient twice.
        // A claim older than 5 minutes is treated as a crashed worker and may be taken over.
        const claim = await this.recipients.createQueryBuilder().update()
            .set({ sentAt: new Date() })
            .where('id = :id AND (sent_at IS NULL OR sent_at < :stale)', { id: recipientId, stale: new Date(Date.now() - 5 * 60_000) })
            .execute();
        if (!claim.affected)
            return true;
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
        const abT = (0, ab_util_1.abThreshold)(campaign.settings);
        const variantB = !!campaign.settings?.subjectB && (abT !== null && !(0, ab_util_1.inTestGroup)(recipient.id, abT)
            ? campaign.settings.abWinner === 'B' // outside the test group: the winner (or A if none yet)
            : (0, ab_util_1.isVariantB)(recipient.id));
        const rawSubject = variantB ? campaign.settings.subjectB : (campaign.subject || campaign.name);
        const subject = (0, renderer_1.renderMergeTags)(rawSubject, this.contactVars(contact));
        const unsub = (0, renderer_1.unsubscribeUrl)({
            secret: this.config.get('trackingSecret'),
            appBaseUrl: this.config.get('appBaseUrl'),
            recipientId: recipient.id, workspaceId, contactId: contact.id,
        });
        const res = await this.email.send({
            workspaceId,
            to: recipient.email,
            subject,
            html,
            text: (0, renderer_1.htmlToText)(html),
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
                this.events.createQueryBuilder().insert().values(['sent', 'delivered'].map((eventType) => ({
                    workspaceId, campaignId, campaignRecipientId: recipientId, contactId: contact.id,
                    eventType: eventType, metadata: { messageId: res.messageId }, dedupeKey: null,
                }))).orIgnore().execute(),
            ]);
            await this.maybeComplete(campaignId);
            return true;
        }
        if (res.retryable) {
            await this.recipients.update(recipientId, { sentAt: null }); // release the claim so the retry can run
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
    /** Runs every minute in the worker. Once a test group has been sent and the wait time has passed, picks the winning
     *  subject and queues the rest of the audience with it. Safe on several workers: the winner is set with a conditional update. */
    async resolveAbWinners() {
        const sending = await this.campaigns.find({ where: { status: 'sending' } });
        for (const c of sending) {
            const T = (0, ab_util_1.abThreshold)(c.settings);
            if (T === null || c.settings.abWinner)
                continue;
            const inFlight = await this.dataSource.query(`SELECT 1 FROM campaign_recipients WHERE campaign_id = ? AND status IN ('pending','queued') AND CONV(LEFT(id,2),16,10) < ? LIMIT 1`, [c.id, T]);
            if (inFlight.length)
                continue; // test group still sending
            const [{ last }] = await this.dataSource.query(`SELECT MAX(sent_at) AS last FROM campaign_recipients WHERE campaign_id = ? AND CONV(LEFT(id,2),16,10) < ?`, [c.id, T]);
            const waitMs = (c.settings.abAutoWinner?.waitHours || 4) * 3600_000;
            if (last && Date.now() < new Date(last).getTime() + waitMs)
                continue;
            const { a, b } = await (0, ab_util_1.abStats)(this.dataSource, c.id, c.workspaceId, T);
            const key = c.settings.abAutoWinner?.metric === 'clicks' ? 'clickRate' : 'openRate';
            const winner = a.sent >= 5 && b.sent >= 5 && b[key] > a[key] ? 'B' : 'A'; // ties / tiny samples → A
            const upd = await this.dataSource.query(`UPDATE campaigns SET settings = JSON_SET(COALESCE(settings, '{}'), '$.abWinner', ?, '$.abDecidedAt', ?)
          WHERE id = ? AND status = 'sending' AND JSON_EXTRACT(COALESCE(settings, '{}'), '$.abWinner') IS NULL`, [winner, new Date().toISOString(), c.id]);
            if (!upd.affectedRows)
                continue;
            this.cache.delete(`c:${c.id}`);
            this.logger.log(`Campaign ${c.id}: A/B winner is ${winner} (A ${a[key]}% vs B ${b[key]}%)`);
            await new Promise((r) => setTimeout(r, 4000)); // let other workers' 3s campaign cache expire before the rest start
            for (;;) {
                const rows = await this.dataSource.query(`SELECT id FROM campaign_recipients WHERE campaign_id = ? AND status = 'pending' AND CONV(LEFT(id,2),16,10) >= ? LIMIT 5000`, [c.id, T]);
                if (!rows.length)
                    break;
                await this.queue.addBulk(queue_constants_1.QUEUES.EMAIL_SENDING, rows.map((r) => ({ name: 'send', data: { recipientId: r.id, campaignId: c.id, workspaceId: c.workspaceId } })));
                await this.recipients.createQueryBuilder().update().set({ status: 'queued' }).whereInIds(rows.map((r) => r.id)).execute();
            }
            await this.maybeComplete(c.id);
        }
    }
    /** Called by the worker when a send job has used up all retries — otherwise the recipient would stay
     *  'queued' forever and the campaign could never complete. */
    async finalizeFailure(recipientId, campaignId, workspaceId, error) {
        const r = await this.recipients.findOne({ where: { id: recipientId, workspaceId } });
        if (!r || !['pending', 'queued'].includes(r.status))
            return;
        await this.recipients.update(recipientId, { status: 'failed', errorMessage: `Gave up after retries: ${error}`.slice(0, 480) });
        await this.campaigns.increment({ id: campaignId }, 'failedCount', 1);
        await this.recordEvent(workspaceId, campaignId, recipientId, r.contactId, 'failed', { error, final: true });
        await this.maybeComplete(campaignId);
    }
    /** True for permanent SMTP rejections (bad mailbox/domain) — false for temporary/greylisting errors. */
    isHardBounce(error) {
        if (!error)
            return false;
        const e = error.toLowerCase();
        return /\b5\d\d\b/.test(e) || /user unknown|does not exist|no such user|mailbox unavailable|invalid recipient|recipient rejected/.test(e);
    }
    contactVars(contact) {
        return {
            id: contact.id, email: contact.email,
            firstName: contact.firstName, lastName: contact.lastName,
            customAttributes: contact.customAttributes || {},
        };
    }
    async renderFor(campaign, recipient, contact, workspaceId) {
        const secret = this.config.get('trackingSecret');
        const trackingBase = this.config.get('trackingBaseUrl');
        const linkRows = await this.cached(`l:${campaign.id}`, 60_000, () => this.links.find({ where: { campaignId: campaign.id } }));
        const linkIds = new Map(linkRows.map((l) => [l.urlHash, l.id]));
        const settings = campaign.settings || {};
        let html = (0, renderer_1.renderMergeTags)(campaign.htmlContent || '', this.contactVars(contact));
        if (settings.includeUnsubscribeLink !== false) {
            html = (0, renderer_1.applyUnsubscribe)(html, (0, renderer_1.unsubscribeUrl)({
                secret, appBaseUrl: this.config.get('appBaseUrl'),
                recipientId: recipient.id, workspaceId, contactId: contact.id,
            }));
        }
        if (settings.trackClicks !== false) {
            html = (0, renderer_1.injectClickTracking)(html, { secret, baseUrl: trackingBase, recipientId: recipient.id, campaignId: campaign.id, linkIds });
        }
        if (settings.trackOpens !== false) {
            html = (0, renderer_1.injectOpenPixel)(html, { secret, baseUrl: trackingBase, recipientId: recipient.id, campaignId: campaign.id });
        }
        return html;
    }
    async recordEvent(workspaceId, campaignId, recipientId, contactId, eventType, metadata = null, dedupeKey) {
        await this.events.createQueryBuilder().insert().values({
            workspaceId, campaignId, campaignRecipientId: recipientId, contactId, eventType, metadata,
            dedupeKey: dedupeKey || null,
        }).orIgnore().execute();
    }
    async maybeComplete(campaignId) {
        const remaining = await this.dataSource.query(`SELECT 1 AS x FROM campaign_recipients WHERE campaign_id = ? AND status IN ('pending','queued') LIMIT 1`, [campaignId]);
        if (!remaining.length) {
            await this.campaigns.update({ id: campaignId, status: 'sending' }, { status: 'completed', completedAt: new Date() });
        }
    }
};
exports.CampaignDispatchService = CampaignDispatchService;
exports.CampaignDispatchService = CampaignDispatchService = CampaignDispatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CampaignRecipient)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.CampaignEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.SenderIdentity)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.TrackedLink)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        campaigns_service_1.CampaignsService,
        email_service_1.EmailService,
        queue_service_1.QueueService,
        config_1.ConfigService,
        typeorm_2.DataSource,
        billing_service_1.BillingService,
        suppression_service_1.SuppressionService])
], CampaignDispatchService);
