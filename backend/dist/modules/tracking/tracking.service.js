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
var TrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = exports.PIXEL = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const tokens_1 = require("../../common/tokens");
exports.PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
let TrackingService = TrackingService_1 = class TrackingService {
    recipients;
    campaigns;
    events;
    links;
    contacts;
    config;
    logger = new common_1.Logger(TrackingService_1.name);
    constructor(recipients, campaigns, events, links, contacts, config) {
        this.recipients = recipients;
        this.campaigns = campaigns;
        this.events = events;
        this.links = links;
        this.contacts = contacts;
        this.config = config;
    }
    async open(token, meta) {
        const payload = (0, tokens_1.verifyToken)(token, this.config.get('trackingSecret'));
        if (!payload)
            return;
        const recipient = await this.recipients.findOne({ where: { id: payload.r, campaignId: payload.c } });
        if (!recipient)
            return;
        const isFirst = !recipient.openedAt;
        await this.recipients.update(recipient.id, {
            openedAt: recipient.openedAt || new Date(),
            openCount: recipient.openCount + 1,
        });
        // dedupeKey makes the first open idempotent, so unique opens stay unique.
        await this.events.createQueryBuilder().insert().into(entities_1.CampaignEvent).values({
            workspaceId: recipient.workspaceId, campaignId: payload.c,
            campaignRecipientId: recipient.id, contactId: recipient.contactId,
            eventType: 'opened', metadata: { ip: meta.ip, userAgent: meta.userAgent?.slice(0, 200) },
            dedupeKey: isFirst ? `open:${recipient.id}` : null,
        }).orIgnore().execute();
        await this.campaigns.increment({ id: payload.c }, 'totalOpens', 1);
        if (isFirst) {
            await this.campaigns.increment({ id: payload.c }, 'uniqueOpens', 1);
            await this.contacts.update(recipient.contactId, { lastEngagedAt: new Date() });
        }
    }
    /** Returns the destination URL only when it matches a link stored at prepare time. */
    async click(token, meta) {
        const payload = (0, tokens_1.verifyToken)(token, this.config.get('trackingSecret'));
        if (!payload)
            return null;
        const link = await this.links.findOne({ where: { id: payload.l, campaignId: payload.c } });
        if (!link)
            return null; // no open-redirect: unknown links go nowhere
        const recipient = await this.recipients.findOne({ where: { id: payload.r, campaignId: payload.c } });
        if (recipient) {
            const isFirst = !recipient.clickedAt;
            await this.recipients.update(recipient.id, {
                clickedAt: recipient.clickedAt || new Date(),
                clickCount: recipient.clickCount + 1,
                openedAt: recipient.openedAt || new Date(),
            });
            await this.events.createQueryBuilder().insert().into(entities_1.CampaignEvent).values({
                workspaceId: recipient.workspaceId, campaignId: payload.c,
                campaignRecipientId: recipient.id, contactId: recipient.contactId,
                eventType: 'clicked', metadata: { url: link.url, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 200) },
                dedupeKey: isFirst ? `click:${recipient.id}:${link.id}` : null,
            }).orIgnore().execute();
            await this.links.increment({ id: link.id }, 'totalClicks', 1);
            await this.campaigns.increment({ id: payload.c }, 'totalClicks', 1);
            if (isFirst) {
                await this.links.increment({ id: link.id }, 'uniqueClicks', 1);
                await this.campaigns.increment({ id: payload.c }, 'uniqueClicks', 1);
                await this.contacts.update(recipient.contactId, { lastEngagedAt: new Date() });
            }
        }
        return link.url;
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = TrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CampaignRecipient)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Campaign)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.CampaignEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.TrackedLink)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], TrackingService);
