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
exports.SendersController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const senders_service_1 = require("./senders.service");
class CreateSenderDto {
    fromName;
    fromEmail;
    replyToEmail;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateSenderDto.prototype, "fromName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSenderDto.prototype, "fromEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSenderDto.prototype, "replyToEmail", void 0);
class UpdateSenderDto {
    fromName;
    replyToEmail;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], UpdateSenderDto.prototype, "fromName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateSenderDto.prototype, "replyToEmail", void 0);
let SendersController = class SendersController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    verify(token) { return this.svc.verify(token); }
    findAll(ws) { return this.svc.findAll(ws); }
    create(ws, dto) { return this.svc.create(ws, dto); }
    update(ws, id, dto) {
        return this.svc.update(ws, id, dto);
    }
    remove(ws, id) { return this.svc.remove(ws, id); }
    resend(ws, id) { return this.svc.resend(ws, id); }
};
exports.SendersController = SendersController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('senders/verify'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SendersController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('senders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SendersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('senders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateSenderDto]),
    __metadata("design:returntype", void 0)
], SendersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('senders/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateSenderDto]),
    __metadata("design:returntype", void 0)
], SendersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('senders/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SendersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('senders/:id/resend'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SendersController.prototype, "resend", null);
exports.SendersController = SendersController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [senders_service_1.SendersService])
], SendersController);
