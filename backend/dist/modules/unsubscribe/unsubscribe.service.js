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
exports.UnsubscribeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tokens_1 = require("../../common/tokens");
const entities_1 = require("../../database/entities");
const maskEmail = (e) => {
    const [u, d] = e.split('@');
    return `${u.slice(0, 2)}${'*'.repeat(Math.max(1, u.length - 2))}@${d}`;
};
let UnsubscribeService = class UnsubscribeService {
    recipients;
    contacts;
    suppressions;
    unsubs;
    events;
    campaigns;
    workspaces;
    config;
    constructor(recipients, contacts, suppressions, unsubs, events, campaigns, workspaces, config) {
        this.recipients = recipients;
        this.contacts = contacts;
        this.suppressions = suppressions;
        this.unsubs = unsubs;
        this.events = events;
        this.campaigns = campaigns;
        this.workspaces = workspaces;
        this.config = config;
    }
    decode(token) {
        const p = (0, tokens_1.verifyToken)(token, this.config.get('trackingSecret'));
        if (!p)
            throw new common_1.BadRequestException('This unsubscribe link is invalid or has expired');
        return p;
    }
    /** Shown on the public unsubscribe page; the address is masked. */
    async info(token) {
        const p = this.decode(token);
        const contact = await this.contacts.findOne({ where: { id: p.ct, workspaceId: p.w } });
        const ws = await this.workspaces.findOne({ where: { id: p.w } });
        return {
            email: contact ? maskEmail(contact.email) : null,
            workspaceName: ws?.name || 'this sender',
            alreadyUnsubscribed: contact ? !contact.subscribed : false,
        };
    }
    async unsubscribe(token, reason, ip) {
        const p = this.decode(token);
        const contact = await this.contacts.findOne({ where: { id: p.ct, workspaceId: p.w } });
        if (!contact)
            throw new common_1.BadRequestException('Contact not found');
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
            await this.events.createQueryBuilder().insert().into(entities_1.CampaignEvent).values({
                workspaceId: p.w, campaignId: recipient.campaignId, campaignRecipientId: recipient.id,
                contactId: contact.id, eventType: 'unsubscribed', metadata: { reason },
                dedupeKey: `unsub:${recipient.id}`,
            }).orIgnore().execute();
            await this.campaigns.increment({ id: recipient.campaignId }, 'unsubscribedCount', 1);
        }
        return { message: 'You have been unsubscribed' };
    }
    async resubscribe(token) {
        const p = this.decode(token);
        const contact = await this.contacts.findOne({ where: { id: p.ct, workspaceId: p.w } });
        if (!contact)
            throw new common_1.BadRequestException('Contact not found');
        await this.contacts.update(contact.id, { status: 'active', subscribed: true });
        await this.suppressions.delete({ workspaceId: p.w, email: contact.email, reason: 'unsubscribe' });
        return { message: 'You have been resubscribed' };
    }
};
exports.UnsubscribeService = UnsubscribeService;
exports.UnsubscribeService = UnsubscribeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CampaignRecipient)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Suppression)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Unsubscribe)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.CampaignEvent)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Campaign)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], UnsubscribeService);
