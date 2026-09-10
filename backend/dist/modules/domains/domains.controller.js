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
exports.DomainsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const domains_service_1 = require("./domains.service");
class CreateDomainDto {
    domain;
    // Which mailbox provider this domain's actual email hosting uses (not necessarily
    // Hostinger) — lets us merge the right SPF include so it doesn't conflict with
    // whatever the client already has configured there.
    mailboxProvider;
    customSpfInclude;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDomainDto.prototype, "domain", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['hostinger', 'google', 'microsoft', 'zoho', 'godaddy', 'custom', 'none']),
    __metadata("design:type", String)
], CreateDomainDto.prototype, "mailboxProvider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDomainDto.prototype, "customSpfInclude", void 0);
let DomainsController = class DomainsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(ws) { return this.svc.findAll(ws); }
    findOne(ws, id) { return this.svc.findOne(ws, id); }
    create(ws, dto) {
        return this.svc.create(ws, dto.domain);
    }
    verify(ws, id) { return this.svc.verify(ws, id); }
    remove(ws, id) { return this.svc.remove(ws, id); }
};
exports.DomainsController = DomainsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DomainsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DomainsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateDomainDto]),
    __metadata("design:returntype", void 0)
], DomainsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DomainsController.prototype, "verify", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DomainsController.prototype, "remove", null);
exports.DomainsController = DomainsController = __decorate([
    (0, common_1.Controller)('domains'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [domains_service_1.DomainsService])
], DomainsController);
