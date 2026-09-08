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
exports.WorkspaceMember = exports.Workspace = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
let Workspace = class Workspace extends base_entity_1.BaseEntity {
    name;
    slug;
    ownerId;
    timezone;
    plan;
    aiDailyLimit;
    status;
    billingName;
    billingEmail;
    billingAddress;
    billingGstin;
    deletedAt;
};
exports.Workspace = Workspace;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Workspace.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Workspace.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id' }),
    __metadata("design:type", String)
], Workspace.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Asia/Kolkata' }),
    __metadata("design:type", String)
], Workspace.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'free' }),
    __metadata("design:type", String)
], Workspace.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_daily_limit', default: 200 }),
    __metadata("design:type", Number)
], Workspace.prototype, "aiDailyLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'suspended'], default: 'active' }),
    __metadata("design:type", String)
], Workspace.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_name', nullable: true }),
    __metadata("design:type", String)
], Workspace.prototype, "billingName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_email', nullable: true }),
    __metadata("design:type", String)
], Workspace.prototype, "billingEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_address', nullable: true }),
    __metadata("design:type", String)
], Workspace.prototype, "billingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_gstin', nullable: true }),
    __metadata("design:type", String)
], Workspace.prototype, "billingGstin", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Workspace.prototype, "deletedAt", void 0);
exports.Workspace = Workspace = __decorate([
    (0, typeorm_1.Entity)('workspaces')
], Workspace);
let WorkspaceMember = class WorkspaceMember extends base_entity_1.BaseEntity {
    workspaceId;
    userId;
    user;
    workspace;
    role;
    invitedEmail;
    inviteToken;
    status;
};
exports.WorkspaceMember = WorkspaceMember;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], WorkspaceMember.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], WorkspaceMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WorkspaceMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", Workspace)
], WorkspaceMember.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['owner', 'admin', 'editor', 'viewer'], default: 'viewer' }),
    __metadata("design:type", String)
], WorkspaceMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invited_email', nullable: true }),
    __metadata("design:type", String)
], WorkspaceMember.prototype, "invitedEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invite_token', nullable: true }),
    __metadata("design:type", String)
], WorkspaceMember.prototype, "inviteToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'invited', 'disabled'], default: 'active' }),
    __metadata("design:type", String)
], WorkspaceMember.prototype, "status", void 0);
exports.WorkspaceMember = WorkspaceMember = __decorate([
    (0, typeorm_1.Entity)('workspace_members')
], WorkspaceMember);
