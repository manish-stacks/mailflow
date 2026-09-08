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
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], GrantAdminDto.prototype, "email", void 0);
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
    stats() { return this.svc.stats(); }
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
    /* -------------------------------------------------------- operators */
    admins() { return this.svc.listAdmins(); }
    grant(dto) { return this.svc.grantAdmin(dto.email); }
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
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "plans", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "archivePlan", null);
__decorate([
    (0, common_1.Get)('workspaces'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryWorkspacesDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "workspaces", null);
__decorate([
    (0, common_1.Get)('workspaces/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "workspace", null);
__decorate([
    (0, common_1.Post)('workspaces/:id/plan'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AssignPlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignPlan", null);
__decorate([
    (0, common_1.Patch)('workspaces/:id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, WorkspaceStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Post)('clients'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ProvisionClientDto, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "provision", null);
__decorate([
    (0, common_1.Get)('admins'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "admins", null);
__decorate([
    (0, common_1.Post)('admins'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GrantAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "grant", null);
__decorate([
    (0, common_1.Delete)('admins/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "revoke", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService, billing_service_1.BillingService])
], AdminController);
