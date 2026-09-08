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
exports.AiUsage = exports.AuditLog = exports.ApiKey = exports.ImportJob = exports.UploadedFile = exports.Suppression = exports.Unsubscribe = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let Unsubscribe = class Unsubscribe {
    id;
    workspaceId;
    contactId;
    campaignId;
    email;
    reason;
    ip;
    createdAt;
};
exports.Unsubscribe = Unsubscribe;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Unsubscribe.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Unsubscribe.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_id', nullable: true }),
    __metadata("design:type", String)
], Unsubscribe.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id', nullable: true }),
    __metadata("design:type", String)
], Unsubscribe.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Unsubscribe.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Unsubscribe.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Unsubscribe.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Unsubscribe.prototype, "createdAt", void 0);
exports.Unsubscribe = Unsubscribe = __decorate([
    (0, typeorm_1.Entity)('unsubscribes')
], Unsubscribe);
let Suppression = class Suppression {
    id;
    workspaceId;
    email;
    reason;
    source;
    createdAt;
};
exports.Suppression = Suppression;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Suppression.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Suppression.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Suppression.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['unsubscribe', 'hard_bounce', 'complaint', 'manual'] }),
    __metadata("design:type", String)
], Suppression.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Suppression.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Suppression.prototype, "createdAt", void 0);
exports.Suppression = Suppression = __decorate([
    (0, typeorm_1.Entity)('suppressions'),
    (0, typeorm_1.Unique)('uq_sup_ws_email', ['workspaceId', 'email'])
], Suppression);
let UploadedFile = class UploadedFile {
    id;
    workspaceId;
    uploadedBy;
    fileName;
    storageKey;
    url;
    mimeType;
    sizeBytes;
    purpose;
    createdAt;
};
exports.UploadedFile = UploadedFile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UploadedFile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], UploadedFile.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', nullable: true }),
    __metadata("design:type", String)
], UploadedFile.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name' }),
    __metadata("design:type", String)
], UploadedFile.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'storage_key', length: 500 }),
    __metadata("design:type", String)
], UploadedFile.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1000, nullable: true }),
    __metadata("design:type", String)
], UploadedFile.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', nullable: true }),
    __metadata("design:type", String)
], UploadedFile.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_bytes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], UploadedFile.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'image' }),
    __metadata("design:type", String)
], UploadedFile.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UploadedFile.prototype, "createdAt", void 0);
exports.UploadedFile = UploadedFile = __decorate([
    (0, typeorm_1.Entity)('uploaded_files')
], UploadedFile);
let ImportJob = class ImportJob extends base_entity_1.BaseEntity {
    workspaceId;
    fileId;
    listId;
    mapping;
    status;
    totalRows;
    validRows;
    invalidRows;
    duplicateRows;
    importedRows;
    failedRows;
    errors;
    createdBy;
};
exports.ImportJob = ImportJob;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], ImportJob.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_id', nullable: true }),
    __metadata("design:type", String)
], ImportJob.prototype, "fileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'list_id', nullable: true }),
    __metadata("design:type", String)
], ImportJob.prototype, "listId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], ImportJob.prototype, "mapping", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }),
    __metadata("design:type", String)
], ImportJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_rows', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "totalRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_rows', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "validRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invalid_rows', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "invalidRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duplicate_rows', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "duplicateRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imported_rows', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "importedRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'failed_rows', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "failedRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], ImportJob.prototype, "errors", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], ImportJob.prototype, "createdBy", void 0);
exports.ImportJob = ImportJob = __decorate([
    (0, typeorm_1.Entity)('import_jobs')
], ImportJob);
let ApiKey = class ApiKey {
    id;
    workspaceId;
    name;
    keyPrefix;
    keyHash;
    scopes;
    lastUsedAt;
    revokedAt;
    createdBy;
    createdAt;
};
exports.ApiKey = ApiKey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ApiKey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], ApiKey.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ApiKey.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'key_prefix', length: 16 }),
    __metadata("design:type", String)
], ApiKey.prototype, "keyPrefix", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'key_hash' }),
    __metadata("design:type", String)
], ApiKey.prototype, "keyHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], ApiKey.prototype, "scopes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_used_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ApiKey.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revoked_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ApiKey.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], ApiKey.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ApiKey.prototype, "createdAt", void 0);
exports.ApiKey = ApiKey = __decorate([
    (0, typeorm_1.Entity)('api_keys')
], ApiKey);
let AuditLog = class AuditLog {
    id;
    workspaceId;
    userId;
    action;
    entityType;
    entityId;
    metadata;
    ip;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs')
], AuditLog);
let AiUsage = class AiUsage {
    id;
    workspaceId;
    userId;
    feature;
    tokensIn;
    tokensOut;
    createdAt;
};
exports.AiUsage = AiUsage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiUsage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], AiUsage.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], AiUsage.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AiUsage.prototype, "feature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tokens_in', default: 0 }),
    __metadata("design:type", Number)
], AiUsage.prototype, "tokensIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tokens_out', default: 0 }),
    __metadata("design:type", Number)
], AiUsage.prototype, "tokensOut", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AiUsage.prototype, "createdAt", void 0);
exports.AiUsage = AiUsage = __decorate([
    (0, typeorm_1.Entity)('ai_usage')
], AiUsage);
