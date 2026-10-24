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
exports.AdminDemoController = exports.DemoController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const decorators_1 = require("../../common/decorators");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permission_guard_1 = require("../../common/guards/permission.guard");
const platform_staff_guard_1 = require("../../common/guards/platform-staff.guard");
const dto_1 = require("./dto");
const demo_service_1 = require("./demo.service");
/** Public — called by the landing page form. Tighter rate limit than the global one. */
let DemoController = class DemoController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(dto, req) {
        return this.svc.create(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
    }
};
exports.DemoController = DemoController;
__decorate([
    (0, decorators_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateDemoRequestDto, Object]),
    __metadata("design:returntype", void 0)
], DemoController.prototype, "create", null);
exports.DemoController = DemoController = __decorate([
    (0, common_1.Controller)('demo-requests'),
    __metadata("design:paramtypes", [demo_service_1.DemoService])
], DemoController);
/** Platform staff only. Read = workspaces.view, change/delete = workspaces.manage. */
let AdminDemoController = class AdminDemoController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(q) { return this.svc.list(q); }
    summary() { return this.svc.summary(); }
    update(id, dto, userId) {
        return this.svc.update(id, dto, userId);
    }
    remove(id) { return this.svc.remove(id); }
};
exports.AdminDemoController = AdminDemoController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermission)('workspaces.view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryDemoRequestsDto]),
    __metadata("design:returntype", void 0)
], AdminDemoController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, decorators_1.RequirePermission)('workspaces.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDemoController.prototype, "summary", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.RequirePermission)('workspaces.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateDemoRequestDto, String]),
    __metadata("design:returntype", void 0)
], AdminDemoController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermission)('workspaces.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminDemoController.prototype, "remove", null);
exports.AdminDemoController = AdminDemoController = __decorate([
    (0, common_1.Controller)('admin/demo-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, platform_staff_guard_1.PlatformStaffGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [demo_service_1.DemoService])
], AdminDemoController);
