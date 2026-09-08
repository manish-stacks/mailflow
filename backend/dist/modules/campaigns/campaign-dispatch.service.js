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
    logger = new common_1.Logger(CampaignDispatchService_1.name);
    constructor(campaigns, recipients, events, contacts, senders, links, campaignsSvc, email, queue, config, dataSource, billing) {
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
                where: { campaignId, contactId: batch.map((b) => b.id) },
                select: ['id'],
            }).catch(() => []);
            const rows = saved.length ? saved : await this.dataSource.query(`SELECT id FROM campaign_recipients WHERE campaign_id = ? AND status = 'pending' LIMIT ? OFFSET ?`, [campaignId, batchSize, offset]);
            await this.queue.addBulk(queue_constants_1.QUEUES.EMAIL_SENDING, rows.map((r) => ({
                name: 'send', data: { recipientId: r.id, campaignId, workspaceId },
            })));
            await this.recipients.createQueryBuilder().update()
                .set({ status: 'queued' }).whereInIds(rows.map((r) => r.id)).execute();
            total += batch.length;
            offset += batchSize;
        }
        await this.campaigns.update(campaignId, { status: 'sending', totalRecipients: total });
        this.logger.log(`Campaign ${campaignId} prepared with ${total} recipients`);
    }
    /** Queue: email-sending. Returns false when the job should be retried. */
    async dispatch(recipientId, campaignId, workspaceId) {
        const recipient = await this.recipients.findOne({ where: { id: recipientId, workspaceId } });
        if (!recipient || ['sent', 'delivered', 'skipped'].includes(recipient.status))
            return true;
        const campaign = await this.campaigns.findOne({ where: { id: campaignId, workspaceId } });
        if (!campaign)
            return true;
        if (['paused', 'cancelled'].includes(campaign.status))
            return true;
        const contact = await this.contacts.findOne({ where: { id: recipient.contactId } });
        // Last-moment eligibility check: someone may have unsubscribed while the job waited.
        if (!contact || contact.status !== 'active' || !contact.subscribed) {
            await this.recipients.update(recipientId, { status: 'skipped', errorMessage: 'Contact is no longer eligible' });
            return true;
        }
        const sender = campaign.senderIdentityId
            ? await this.senders.findOne({ where: { id: campaign.senderIdentityId } })
            : null;
        const html = await this.renderFor(campaign, recipient, contact, workspaceId);
        const subject = (0, renderer_1.renderMergeTags)(campaign.subject || campaign.name, this.contactVars(contact));
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
            await this.recipients.update(recipientId, { status: 'sent', sentAt: new Date(), messageId: res.messageId });
            await this.campaigns.increment({ id: campaignId }, 'sentCount', 1);
            await this.billing.increment(workspaceId, 'emailsSent', 1);
            await this.recordEvent(workspaceId, campaignId, recipientId, contact.id, 'sent', { messageId: res.messageId });
            await this.maybeComplete(campaignId);
            return true;
        }
        if (res.retryable)
            return false; // BullMQ retries with backoff
        await this.recipients.update(recipientId, { status: 'failed', errorMessage: res.error?.slice(0, 480) });
        await this.campaigns.increment({ id: campaignId }, 'failedCount', 1);
        await this.recordEvent(workspaceId, campaignId, recipientId, contact.id, 'failed', { error: res.error });
        await this.maybeComplete(campaignId);
        return true;
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
        const linkRows = await this.links.find({ where: { campaignId: campaign.id } });
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
        const remaining = await this.dataSource.query(`SELECT COUNT(*) AS c FROM campaign_recipients WHERE campaign_id = ? AND status IN ('pending','queued')`, [campaignId]);
        if (+remaining[0].c === 0) {
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
        billing_service_1.BillingService])
], CampaignDispatchService);
