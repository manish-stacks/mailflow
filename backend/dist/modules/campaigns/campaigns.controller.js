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
exports.CampaignsController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const analytics_service_1 = require("../analytics/analytics.service");
const campaigns_service_1 = require("./campaigns.service");
const dto_1 = require("./dto");
// ApiKeyAuthGuard accepts an `x-api-key` header OR a normal session JWT,
// so this controller is now usable both from the dashboard and via API keys.
let CampaignsController = class CampaignsController {
    svc;
    analytics;
    constructor(svc, analytics) {
        this.svc = svc;
        this.analytics = analytics;
    }
    findAll(ws, q) { return this.svc.findAll(ws, q); }
    findOne(ws, id) { return this.svc.findOne(ws, id); }
    create(ws, uid, dto) {
        return this.svc.create(ws, uid, dto);
    }
    update(ws, id, dto) {
        return this.svc.update(ws, id, dto);
    }
    remove(ws, id) { return this.svc.remove(ws, id); }
    duplicate(ws, id, uid) {
        return this.svc.duplicate(ws, id, uid);
    }
    audience(ws, id) { return this.svc.estimateAudience(ws, id); }
    validate(ws, id) { return this.svc.validate(ws, id); }
    test(ws, id, dto) {
        return this.svc.sendTest(ws, id, dto.recipients);
    }
    send(ws, id) { return this.svc.send(ws, id); }
    schedule(ws, id, dto) {
        return this.svc.schedule(ws, id, dto.scheduledAt);
    }
    pause(ws, id) { return this.svc.pause(ws, id); }
    resume(ws, id) { return this.svc.resume(ws, id); }
    cancel(ws, id) { return this.svc.cancel(ws, id); }
    recipients(ws, id, q) {
        return this.svc.recipients_(ws, id, q);
    }
    stats(ws, id) { return this.analytics.campaign(ws, id); }
    links(ws, id) { return this.analytics.campaignLinks(ws, id); }
    activity(ws, id, limit) {
        return this.analytics.campaignActivity(ws, id, limit ? +limit : 100);
    }
};
exports.CampaignsController = CampaignsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.QueryCampaignsDto]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.CreateCampaignDto]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateCampaignDto]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Get)(':id/audience'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "audience", null);
__decorate([
    (0, common_1.Get)(':id/validate'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.TestCampaignDto]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "test", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "send", null);
__decorate([
    (0, common_1.Post)(':id/schedule'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ScheduleCampaignDto]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "schedule", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id/recipients'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "recipients", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)(':id/links'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "links", null);
__decorate([
    (0, common_1.Get)(':id/activity'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CampaignsController.prototype, "activity", null);
exports.CampaignsController = CampaignsController = __decorate([
    (0, common_1.Controller)('campaigns'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService, analytics_service_1.AnalyticsService])
], CampaignsController);
