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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackedLink = exports.CampaignEvent = exports.CampaignRecipient = exports.Campaign = exports.EmailTemplate = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let EmailTemplate = class EmailTemplate extends base_entity_1.BaseEntity {
    workspaceId;
    name;
    category;
    subject;
    previewText;
    htmlContent;
    designJson;
    thumbnail;
    createdBy;
    deletedAt;
};
exports.EmailTemplate = EmailTemplate;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'general' }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preview_text', nullable: true }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "previewText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'html_content', type: 'mediumtext', nullable: true }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "htmlContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'design_json', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], EmailTemplate.prototype, "designJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "thumbnail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], EmailTemplate.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], EmailTemplate.prototype, "deletedAt", void 0);
exports.EmailTemplate = EmailTemplate = __decorate([
    (0, typeorm_1.Entity)('email_templates')
], EmailTemplate);
let Campaign = class Campaign extends base_entity_1.BaseEntity {
    workspaceId;
    name;
    subject;
    previewText;
    htmlContent;
    designJson;
    templateId;
    senderIdentityId;
    audience;
    settings;
    status;
    scheduledAt;
    startedAt;
    completedAt;
    totalRecipients;
    sentCount;
    deliveredCount;
    failedCount;
    bouncedCount;
    complainedCount;
    unsubscribedCount;
    uniqueOpens;
    totalOpens;
    uniqueClicks;
    totalClicks;
    createdBy;
    deletedAt;
};
exports.Campaign = Campaign;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Campaign.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Campaign.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preview_text', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "previewText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'html_content', type: 'mediumtext', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "htmlContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'design_json', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Campaign.prototype, "designJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'template_id', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_identity_id', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "senderIdentityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Campaign.prototype, "audience", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Campaign.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'scheduled', 'preparing', 'sending', 'completed', 'paused', 'cancelled', 'failed'], default: 'draft' }),
    __metadata("design:type", String)
], Campaign.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'scheduled_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Campaign.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Campaign.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Campaign.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_recipients', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "totalRecipients", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_count', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "sentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_count', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "deliveredCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'failed_count', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "failedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bounced_count', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "bouncedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'complained_count', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "complainedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unsubscribed_count', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "unsubscribedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_opens', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "uniqueOpens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_opens', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "totalOpens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_clicks', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "uniqueClicks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_clicks', default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "totalClicks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Campaign.prototype, "deletedAt", void 0);
exports.Campaign = Campaign = __decorate([
    (0, typeorm_1.Entity)('campaigns'),
    (0, typeorm_1.Index)('idx_cp_ws_status', ['workspaceId', 'status'])
], Campaign);
let CampaignRecipient = class CampaignRecipient extends base_entity_1.BaseEntity {
    workspaceId;
    campaignId;
    contactId;
    email;
    status;
    errorMessage;
    messageId;
    openCount;
    clickCount;
    sentAt;
    deliveredAt;
    openedAt;
    clickedAt;
    bouncedAt;
    unsubscribedAt;
};
exports.CampaignRecipient = CampaignRecipient;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id' }),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'contact_id' }),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['pending', 'queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped'], default: 'pending' }),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', nullable: true }),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'message_id', nullable: true }),
    __metadata("design:type", String)
], CampaignRecipient.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'open_count', default: 0 }),
    __metadata("design:type", Number)
], CampaignRecipient.prototype, "openCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'click_count', default: 0 }),
    __metadata("design:type", Number)
], CampaignRecipient.prototype, "clickCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], CampaignRecipient.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], CampaignRecipient.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opened_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], CampaignRecipient.prototype, "openedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clicked_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], CampaignRecipient.prototype, "clickedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bounced_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], CampaignRecipient.prototype, "bouncedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unsubscribed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], CampaignRecipient.prototype, "unsubscribedAt", void 0);
exports.CampaignRecipient = CampaignRecipient = __decorate([
    (0, typeorm_1.Entity)('campaign_recipients'),
    (0, typeorm_1.Unique)('uq_cr_campaign_contact', ['campaignId', 'contactId']),
    (0, typeorm_1.Index)('idx_cr_campaign_status', ['campaignId', 'status'])
], CampaignRecipient);
let CampaignEvent = class CampaignEvent {
    id;
    workspaceId;
    campaignId;
    campaignRecipientId;
    contactId;
    eventType;
    metadata;
    dedupeKey;
    createdAt;
};
exports.CampaignEvent = CampaignEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], CampaignEvent.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id' }),
    __metadata("design:type", String)
], CampaignEvent.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'campaign_recipient_id', nullable: true }),
    __metadata("design:type", String)
], CampaignEvent.prototype, "campaignRecipientId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'contact_id', nullable: true }),
    __metadata("design:type", String)
], CampaignEvent.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'enum', enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed'] }),
    __metadata("design:type", String)
], CampaignEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CampaignEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ name: 'dedupe_key', length: 191, nullable: true }),
    __metadata("design:type", String)
], CampaignEvent.prototype, "dedupeKey", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CampaignEvent.prototype, "createdAt", void 0);
exports.CampaignEvent = CampaignEvent = __decorate([
    (0, typeorm_1.Entity)('campaign_events'),
    (0, typeorm_1.Index)('idx_ce_campaign_type', ['campaignId', 'eventType'])
], CampaignEvent);
let TrackedLink = class TrackedLink {
    id;
    workspaceId;
    campaignId;
    url;
    urlHash;
    label;
    totalClicks;
    uniqueClicks;
    createdAt;
};
exports.TrackedLink = TrackedLink;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrackedLink.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], TrackedLink.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id' }),
    __metadata("design:type", String)
], TrackedLink.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2048 }),
    __metadata("design:type", String)
], TrackedLink.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_hash', length: 64 }),
    __metadata("design:type", String)
], TrackedLink.prototype, "urlHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TrackedLink.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_clicks', default: 0 }),
    __metadata("design:type", Number)
], TrackedLink.prototype, "totalClicks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_clicks', default: 0 }),
    __metadata("design:type", Number)
], TrackedLink.prototype, "uniqueClicks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TrackedLink.prototype, "createdAt", void 0);
exports.TrackedLink = TrackedLink = __decorate([
    (0, typeorm_1.Entity)('tracked_links'),
    (0, typeorm_1.Unique)('uq_tl_campaign_url', ['campaignId', 'urlHash'])
], TrackedLink);
