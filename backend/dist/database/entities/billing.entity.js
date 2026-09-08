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
exports.EmailConnection = exports.UsagePeriod = exports.Subscription = exports.Plan = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
/** -1 on any numeric limit means unlimited. */
let Plan = class Plan extends base_entity_1.BaseEntity {
    name;
    slug;
    description;
    priceMonthly;
    priceYearly;
    currency;
    maxContacts;
    maxEmailsPerMonth;
    maxCampaignsPerMonth;
    maxTeamMembers;
    maxSenderIdentities;
    maxDomains;
    aiCreditsPerDay;
    allowCustomSmtp;
    allowApiAccess;
    allowAi;
    allowSegments;
    removeBranding;
    isPublic;
    isActive;
    sortOrder;
};
exports.Plan = Plan;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Plan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Plan.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Plan.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: { to: (v) => v, from: (v) => Number(v) } }),
    __metadata("design:type", Number)
], Plan.prototype, "priceMonthly", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_yearly', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: { to: (v) => v, from: (v) => Number(v) } }),
    __metadata("design:type", Number)
], Plan.prototype, "priceYearly", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'INR' }),
    __metadata("design:type", String)
], Plan.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_contacts', default: 1000 }),
    __metadata("design:type", Number)
], Plan.prototype, "maxContacts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_emails_per_month', default: 5000 }),
    __metadata("design:type", Number)
], Plan.prototype, "maxEmailsPerMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_campaigns_per_month', default: -1 }),
    __metadata("design:type", Number)
], Plan.prototype, "maxCampaignsPerMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_team_members', default: 2 }),
    __metadata("design:type", Number)
], Plan.prototype, "maxTeamMembers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_sender_identities', default: 1 }),
    __metadata("design:type", Number)
], Plan.prototype, "maxSenderIdentities", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_domains', default: 1 }),
    __metadata("design:type", Number)
], Plan.prototype, "maxDomains", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_credits_per_day', default: 20 }),
    __metadata("design:type", Number)
], Plan.prototype, "aiCreditsPerDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allow_custom_smtp', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "allowCustomSmtp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allow_api_access', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "allowApiAccess", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allow_ai', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "allowAi", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allow_segments', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "allowSegments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remove_branding', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "removeBranding", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], Plan.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], Plan.prototype, "sortOrder", void 0);
exports.Plan = Plan = __decorate([
    (0, typeorm_1.Entity)('plans')
], Plan);
let Subscription = class Subscription extends base_entity_1.BaseEntity {
    workspaceId;
    planId;
    status;
    billingCycle;
    currentPeriodStart;
    currentPeriodEnd;
    trialEndsAt;
    cancelledAt;
    /** Per-customer limit overrides, merged over the plan at read time. */
    overrides;
    notes;
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Subscription.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'plan_id' }),
    __metadata("design:type", String)
], Subscription.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['trialing', 'active', 'past_due', 'cancelled', 'suspended'], default: 'active' }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_cycle', type: 'enum', enum: ['monthly', 'yearly', 'lifetime', 'free'], default: 'monthly' }),
    __metadata("design:type", String)
], Subscription.prototype, "billingCycle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_start', type: 'datetime' }),
    __metadata("design:type", Date)
], Subscription.prototype, "currentPeriodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_end', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Subscription.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trial_ends_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Subscription.prototype, "trialEndsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Subscription.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "overrides", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Subscription.prototype, "notes", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)('subscriptions'),
    (0, typeorm_1.Unique)('uq_sub_workspace', ['workspaceId'])
], Subscription);
let UsagePeriod = class UsagePeriod extends base_entity_1.BaseEntity {
    workspaceId;
    period;
    emailsSent;
    campaignsCreated;
    contactsImported;
    aiCalls;
};
exports.UsagePeriod = UsagePeriod;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], UsagePeriod.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7 }),
    __metadata("design:type", String)
], UsagePeriod.prototype, "period", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'emails_sent', default: 0 }),
    __metadata("design:type", Number)
], UsagePeriod.prototype, "emailsSent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaigns_created', default: 0 }),
    __metadata("design:type", Number)
], UsagePeriod.prototype, "campaignsCreated", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contacts_imported', default: 0 }),
    __metadata("design:type", Number)
], UsagePeriod.prototype, "contactsImported", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_calls', default: 0 }),
    __metadata("design:type", Number)
], UsagePeriod.prototype, "aiCalls", void 0);
exports.UsagePeriod = UsagePeriod = __decorate([
    (0, typeorm_1.Entity)('usage_periods'),
    (0, typeorm_1.Unique)('uq_usage_ws_period', ['workspaceId', 'period'])
], UsagePeriod);
let EmailConnection = class EmailConnection extends base_entity_1.BaseEntity {
    workspaceId;
    label;
    provider;
    host;
    port;
    secure;
    username;
    /** AES-256-GCM ciphertext. Never selected into an API response. */
    passwordEnc;
    fromName;
    fromEmail;
    dailyLimit;
    ratePerMinute;
    status;
    lastError;
    lastTestedAt;
    isActive;
};
exports.EmailConnection = EmailConnection;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], EmailConnection.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Primary' }),
    __metadata("design:type", String)
], EmailConnection.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['smtp', 'gmail', 'outlook', 'ses', 'brevo', 'sendgrid', 'mailgun'], default: 'smtp' }),
    __metadata("design:type", String)
], EmailConnection.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailConnection.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 587 }),
    __metadata("design:type", Number)
], EmailConnection.prototype, "port", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], EmailConnection.prototype, "secure", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailConnection.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_enc', type: 'text', nullable: true }),
    __metadata("design:type", String)
], EmailConnection.prototype, "passwordEnc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_name', nullable: true }),
    __metadata("design:type", String)
], EmailConnection.prototype, "fromName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_email', nullable: true }),
    __metadata("design:type", String)
], EmailConnection.prototype, "fromEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'daily_limit', default: 0 }),
    __metadata("design:type", Number)
], EmailConnection.prototype, "dailyLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate_per_minute', default: 0 }),
    __metadata("design:type", Number)
], EmailConnection.prototype, "ratePerMinute", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['untested', 'verified', 'failed'], default: 'untested' }),
    __metadata("design:type", String)
], EmailConnection.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', nullable: true }),
    __metadata("design:type", String)
], EmailConnection.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_tested_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], EmailConnection.prototype, "lastTestedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'tinyint', default: 1, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } }),
    __metadata("design:type", Boolean)
], EmailConnection.prototype, "isActive", void 0);
exports.EmailConnection = EmailConnection = __decorate([
    (0, typeorm_1.Entity)('email_connections'),
    (0, typeorm_1.Unique)('uq_mailconn_ws', ['workspaceId'])
], EmailConnection);
