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
exports.AutomationEnrollment = exports.AutomationStep = exports.Automation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let Automation = class Automation extends base_entity_1.BaseEntity {
    workspaceId;
    name;
    triggerType;
    listId;
    senderIdentityId;
    status;
    activatedAt;
    createdBy;
    deletedAt;
};
exports.Automation = Automation;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Automation.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Automation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trigger_type', type: 'enum', enum: ['list_join', 'contact_created'], default: 'list_join' }),
    __metadata("design:type", String)
], Automation.prototype, "triggerType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'list_id', nullable: true }),
    __metadata("design:type", String)
], Automation.prototype, "listId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_identity_id', nullable: true }),
    __metadata("design:type", String)
], Automation.prototype, "senderIdentityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'active', 'paused'], default: 'draft' }),
    __metadata("design:type", String)
], Automation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activated_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Automation.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], Automation.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Automation.prototype, "deletedAt", void 0);
exports.Automation = Automation = __decorate([
    (0, typeorm_1.Entity)('automations')
], Automation);
let AutomationStep = class AutomationStep extends base_entity_1.BaseEntity {
    automationId;
    position;
    delayMinutes;
    subject;
    previewText;
    htmlContent;
};
exports.AutomationStep = AutomationStep;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'automation_id' }),
    __metadata("design:type", String)
], AutomationStep.prototype, "automationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], AutomationStep.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delay_minutes', default: 0 }),
    __metadata("design:type", Number)
], AutomationStep.prototype, "delayMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AutomationStep.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preview_text', nullable: true }),
    __metadata("design:type", String)
], AutomationStep.prototype, "previewText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'html_content', type: 'mediumtext', nullable: true }),
    __metadata("design:type", String)
], AutomationStep.prototype, "htmlContent", void 0);
exports.AutomationStep = AutomationStep = __decorate([
    (0, typeorm_1.Entity)('automation_steps')
], AutomationStep);
let AutomationEnrollment = class AutomationEnrollment extends base_entity_1.BaseEntity {
    workspaceId;
    automationId;
    contactId;
    nextStep;
    nextRunAt;
    status;
    sentCount;
    attempts;
    lastError;
};
exports.AutomationEnrollment = AutomationEnrollment;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], AutomationEnrollment.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'automation_id' }),
    __metadata("design:type", String)
], AutomationEnrollment.prototype, "automationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_id' }),
    __metadata("design:type", String)
], AutomationEnrollment.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_step', default: 0 }),
    __metadata("design:type", Number)
], AutomationEnrollment.prototype, "nextStep", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_run_at', type: 'datetime' }),
    __metadata("design:type", Date)
], AutomationEnrollment.prototype, "nextRunAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'completed', 'cancelled'], default: 'active' }),
    __metadata("design:type", String)
], AutomationEnrollment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_count', default: 0 }),
    __metadata("design:type", Number)
], AutomationEnrollment.prototype, "sentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], AutomationEnrollment.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', nullable: true }),
    __metadata("design:type", String)
], AutomationEnrollment.prototype, "lastError", void 0);
exports.AutomationEnrollment = AutomationEnrollment = __decorate([
    (0, typeorm_1.Entity)('automation_enrollments'),
    (0, typeorm_1.Unique)('uq_ae_auto_contact', ['automationId', 'contactId'])
], AutomationEnrollment);
