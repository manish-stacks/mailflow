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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const decorators_1 = require("../../common/decorators");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const entities_1 = require("../../database/entities");
const payments_service_1 = require("./payments.service");
const razorpay_service_1 = require("./razorpay.service");
const dto_1 = require("./dto");
let PaymentsController = class PaymentsController {
    svc;
    razorpay;
    workspaces;
    constructor(svc, razorpay, workspaces) {
        this.svc = svc;
        this.razorpay = razorpay;
        this.workspaces = workspaces;
    }
    /** Lets the frontend know whether to render a pay button at all. */
    config() { return this.svc.publicConfig; }
    checkout(ws, uid, dto) {
        return this.svc.checkout(ws, uid, dto);
    }
    verify(ws, dto) {
        return this.svc.verify(ws, dto);
    }
    history(ws, q) { return this.svc.history(ws, q); }
    invoice(ws, id) {
        return this.svc.invoice(ws, id);
    }
    async saveDetails(ws, dto) {
        await this.workspaces.update(ws, dto);
        return this.workspaces.findOne({ where: { id: ws } });
    }
    /**
     * Razorpay webhook. Public by necessity, so the signature over the raw body is
     * the only thing standing between this and a forged activation.
     */
    async webhook(signature, body, req) {
        const raw = req.rawBody ?? JSON.stringify(body);
        if (!this.razorpay.verifyWebhookSignature(raw, signature)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        // Razorpay retries on non-2xx, so failures here are recoverable by design.
        return this.svc.handleWebhook(body?.event, body?.payload);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('payments/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "config", null);
__decorate([
    (0, common_1.Post)('payments/checkout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('owner'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.CheckoutDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('payments/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('owner'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.VerifyPaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)('payments/:id/invoice'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "invoice", null);
__decorate([
    (0, common_1.Patch)('billing/details'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.BillingDetailsDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "saveDetails", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('webhooks/razorpay'),
    __param(0, (0, common_1.Headers)('x-razorpay-signature')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "webhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)(),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        razorpay_service_1.RazorpayService,
        typeorm_2.Repository])
], PaymentsController);
