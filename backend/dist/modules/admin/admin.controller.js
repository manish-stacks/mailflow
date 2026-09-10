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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../../common/guards/super-admin.guard");
const platform_staff_guard_1 = require("../../common/guards/platform-staff.guard");
const permission_guard_1 = require("../../common/guards/permission.guard");
const billing_service_1 = require("../billing/billing.service");
const dto_1 = require("../billing/dto");
const admin_service_1 = require("./admin.service");
class QueryWorkspacesDto extends pagination_dto_1.PaginationDto {
    status;
    plan;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'suspended']),
    __metadata("design:type", String)
], QueryWorkspacesDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryWorkspacesDto.prototype, "plan", void 0);
class QueryPaymentsDto extends pagination_dto_1.PaginationDto {
    status;
    workspaceId;
    from;
    to;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['created', 'pending', 'paid', 'failed', 'refunded']),
    __metadata("design:type", String)
], QueryPaymentsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPaymentsDto.prototype, "workspaceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], QueryPaymentsDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], QueryPaymentsDto.prototype, "to", void 0);
class ProvisionClientDto {
    workspaceName;
    email;
    firstName;
    lastName;
    password;
    plan;
    billingCycle;
    trialDays;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ProvisionClientDto.prototype, "workspaceName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ProvisionClientDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], ProvisionClientDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProvisionClientDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ProvisionClientDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProvisionClientDto.prototype, "plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['monthly', 'yearly', 'lifetime', 'free']),
    __metadata("design:type", Object)
], ProvisionClientDto.prototype, "billingCycle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProvisionClientDto.prototype, "trialDays", void 0);
class GrantAdminDto {
    email;
    full;
    permissions;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], GrantAdminDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GrantAdminDto.prototype, "full", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GrantAdminDto.prototype, "permissions", void 0);
class UpdatePermissionsDto {
    permissions;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePermissionsDto.prototype, "permissions", void 0);
class WorkspaceStatusDto {
    status;
}
__decorate([
    (0, class_validator_1.IsIn)(['active', 'suspended']),
    __metadata("design:type", String)
], WorkspaceStatusDto.prototype, "status", void 0);
let AdminController = class AdminController {
    svc;
    billing;
    constructor(svc, billing) {
        this.svc = svc;
        this.billing = billing;
    }
    /** Also doubles as the frontend's "am I platform staff at all" access check. */
    stats() { return this.svc.stats(); }
    permissionList() { return this.svc.availablePermissions(); }
    /* ------------------------------------------------------------ plans */
    plans() { return this.billing.listAll(); }
    createPlan(dto) { return this.billing.createPlan(dto); }
    updatePlan(id, dto) {
        return this.billing.updatePlan(id, dto);
    }
    archivePlan(id) { return this.billing.archivePlan(id); }
    /* ------------------------------------------------------- workspaces */
    workspaces(q) { return this.svc.listWorkspaces(q); }
    workspace(id) { return this.svc.workspaceDetail(id); }
    assignPlan(id, dto) {
        return this.svc.assignPlan(id, dto.plan, dto);
    }
    setStatus(id, dto) {
        return this.svc.setWorkspaceStatus(id, dto.status);
    }
    /** One call: client login + workspace + plan. */
    provision(dto, uid) {
        return this.svc.provisionClient(dto, uid);
    }
    /**
     * Logs the admin into the client's own account, no password involved.
     * Meant to be opened in a new tab so the admin's own session stays intact.
     */
    impersonate(id, uid) {
        return this.svc.impersonateWorkspace(id, uid);
    }
    /* -------------------------------------------------------------- payments */
    payments(q) { return this.svc.listPayments(q); }
    /* -------------------------------------------------------- operators */
    // Managing platform admins can create a new super admin, so this stays
    // locked to true super admins regardless of any delegated permission.
    admins() { return this.svc.listAdmins(); }
    grant(dto) { return this.svc.grantAdmin(dto.email, dto); }
    updatePermissions(id, dto) {
        return this.svc.updateAdminPermissions(id, dto.permissions);
    }
    revoke(id, uid) {
        return this.svc.revokeAdmin(id, uid);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "permissionList", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, decorators_1.RequirePermission)('plans.manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "plans", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, decorators_1.RequirePermission)('plans.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    (0, decorators_1.RequirePermission)('plans.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    (0, decorators_1.RequirePermission)('plans.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "archivePlan", null);
__decorate([
    (0, common_1.Get)('workspaces'),
    (0, decorators_1.RequirePermission)('workspaces.view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryWorkspacesDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "workspaces", null);
__decorate([
    (0, common_1.Get)('workspaces/:id'),
    (0, decorators_1.RequirePermission)('workspaces.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "workspace", null);
__decorate([
    (0, common_1.Post)('workspaces/:id/plan'),
    (0, decorators_1.RequirePermission)('workspaces.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AssignPlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignPlan", null);
__decorate([
    (0, common_1.Patch)('workspaces/:id/status'),
    (0, decorators_1.RequirePermission)('workspaces.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, WorkspaceStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Post)('clients'),
    (0, decorators_1.RequirePermission)('workspaces.manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ProvisionClientDto, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "provision", null);
__decorate([
    (0, common_1.Post)('workspaces/:id/impersonate'),
    (0, decorators_1.RequirePermission)('impersonate'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "impersonate", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, decorators_1.RequirePermission)('payments.view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryPaymentsDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "payments", null);
__decorate([
    (0, common_1.Get)('admins'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "admins", null);
__decorate([
    (0, common_1.Post)('admins'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GrantAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "grant", null);
__decorate([
    (0, common_1.Patch)('admins/:id/permissions'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePermissionsDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePermissions", null);
__decorate([
    (0, common_1.Delete)('admins/:id'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "revoke", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, platform_staff_guard_1.PlatformStaffGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService, billing_service_1.BillingService])
], AdminController);
