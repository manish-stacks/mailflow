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
exports.SenderDomain = exports.SenderIdentity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let SenderIdentity = class SenderIdentity extends base_entity_1.BaseEntity {
    workspaceId;
    fromName;
    fromEmail;
    replyToEmail;
    status;
    verificationToken;
    verifiedAt;
    isDefault;
};
exports.SenderIdentity = SenderIdentity;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], SenderIdentity.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_name' }),
    __metadata("design:type", String)
], SenderIdentity.prototype, "fromName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_email' }),
    __metadata("design:type", String)
], SenderIdentity.prototype, "fromEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reply_to_email', nullable: true }),
    __metadata("design:type", String)
], SenderIdentity.prototype, "replyToEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['pending', 'verified', 'failed'], default: 'pending' }),
    __metadata("design:type", String)
], SenderIdentity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verification_token', nullable: true }),
    __metadata("design:type", String)
], SenderIdentity.prototype, "verificationToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], SenderIdentity.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_default', type: 'tinyint', default: 0 }),
    __metadata("design:type", Boolean)
], SenderIdentity.prototype, "isDefault", void 0);
exports.SenderIdentity = SenderIdentity = __decorate([
    (0, typeorm_1.Entity)('sender_identities'),
    (0, typeorm_1.Unique)('uq_sender_ws_email', ['workspaceId', 'fromEmail'])
], SenderIdentity);
let SenderDomain = class SenderDomain extends base_entity_1.BaseEntity {
    workspaceId;
    domain;
    provider;
    verificationStatus;
    verificationRecords;
    lastCheckedAt;
    verifiedAt;
};
exports.SenderDomain = SenderDomain;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], SenderDomain.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SenderDomain.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'smtp' }),
    __metadata("design:type", String)
], SenderDomain.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verification_status', type: 'enum', enum: ['pending', 'verifying', 'verified', 'failed'], default: 'pending' }),
    __metadata("design:type", String)
], SenderDomain.prototype, "verificationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verification_records', type: 'json', nullable: true }),
    __metadata("design:type", Array)
], SenderDomain.prototype, "verificationRecords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_checked_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], SenderDomain.prototype, "lastCheckedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], SenderDomain.prototype, "verifiedAt", void 0);
exports.SenderDomain = SenderDomain = __decorate([
    (0, typeorm_1.Entity)('sender_domains'),
    (0, typeorm_1.Unique)('uq_domain_ws', ['workspaceId', 'domain'])
], SenderDomain);
