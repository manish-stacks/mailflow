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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const email_service_1 = require("../../integrations/email/email.service");
const HARD_BOUNCE = ['bounce', 'bounced', 'hard_bounce', 'hardbounce', 'failed', 'rejected'];
let WebhooksService = WebhooksService_1 = class WebhooksService {
    recipients;
    events;
    campaigns;
    contacts;
    suppressions;
    email;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(recipients, events, campaigns, contacts, suppressions, email) {
        this.recipients = recipients;
        this.events = events;
        this.campaigns = campaigns;
        this.contacts = contacts;
        this.suppressions = suppressions;
        this.email = email;
    }
    verify(provider, headers, rawBody) {
        return this.email.provider.name === provider && this.email.provider.verifyWebhook(headers, rawBody);
    }
    parse(payload) {
        return this.email.provider.parseWebhook(payload);
    }
    async process(event) {
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
    async record(recipient, eventType, event, dedupeKey) {
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
    async suppress(recipient, reason) {
        await this.suppressions.createQueryBuilder().insert()
            .values({ workspaceId: recipient.workspaceId, email: recipient.email, reason, source: 'webhook' })
            .orIgnore().execute();
        await this.contacts.update({ workspaceId: recipient.workspaceId, email: recipient.email }, { status: reason === 'complaint' ? 'complained' : 'bounced', subscribed: false });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CampaignRecipient)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CampaignEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Campaign)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Suppression)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService])
], WebhooksService);
