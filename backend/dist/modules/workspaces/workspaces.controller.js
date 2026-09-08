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
exports.WorkspacesController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const dto_1 = require("./dto");
const workspaces_service_1 = require("./workspaces.service");
let WorkspacesController = class WorkspacesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(userId) { return this.svc.listForUser(userId); }
    create(userId, dto) { return this.svc.create(userId, dto); }
    current(id) { return this.svc.findOne(id); }
    update(id, dto, userId) {
        return this.svc.update(id, dto, userId);
    }
    remove(id, userId) { return this.svc.remove(id, userId); }
    members(id) { return this.svc.listMembers(id); }
    invite(id, dto, userId) {
        return this.svc.invite(id, dto, userId);
    }
    /** Create the login directly instead of sending an invite link. */
    createLogin(id, dto, userId) {
        return this.svc.createMemberLogin(id, dto, userId);
    }
    resetMemberPassword(id, memberId, userId) {
        return this.svc.resetMemberPassword(id, memberId, userId);
    }
    updateMember(id, memberId, dto, userId) {
        return this.svc.updateMember(id, memberId, dto, userId);
    }
    removeMember(id, memberId, userId) {
        return this.svc.removeMember(id, memberId, userId);
    }
    audit(id) { return this.svc.auditLogs(id); }
};
exports.WorkspacesController = WorkspacesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateWorkspaceDto]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "current", null);
__decorate([
    (0, common_1.Patch)('current'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateWorkspaceDto, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('current'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('owner'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('members'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "members", null);
__decorate([
    (0, common_1.Post)('members'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.InviteMemberDto, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('members/create-login'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateMemberLoginDto, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "createLogin", null);
__decorate([
    (0, common_1.Post)('members/:memberId/reset-password'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "resetMemberPassword", null);
__decorate([
    (0, common_1.Patch)('members/:memberId'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateMemberDto, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)('members/:memberId'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, common_1.UseGuards)(workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "audit", null);
exports.WorkspacesController = WorkspacesController = __decorate([
    (0, common_1.Controller)('workspaces'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [workspaces_service_1.WorkspacesService])
], WorkspacesController);
