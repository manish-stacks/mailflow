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
exports.SegmentsController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const dto_1 = require("./dto");
const segment_rules_1 = require("./segment-rules");
const segments_service_1 = require("./segments.service");
let SegmentsController = class SegmentsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    /** Powers the rule builder dropdowns so the UI can never offer an unsupported combination. */
    schema() {
        return {
            fields: Object.entries(segment_rules_1.FIELD_MAP).map(([key, v]) => ({ key, kind: v.kind, operators: segment_rules_1.OPERATORS_BY_KIND[v.kind] })),
            supportsCustomAttributes: true,
        };
    }
    findAll(ws) { return this.svc.findAll(ws); }
    findOne(ws, id) { return this.svc.findOne(ws, id); }
    count(ws, id) { return this.svc.count(ws, id); }
    create(ws, dto) { return this.svc.create(ws, dto); }
    previewNew(ws, dto) { return this.svc.preview(ws, dto); }
    preview(ws, id, dto) {
        return this.svc.preview(ws, dto);
    }
    update(ws, id, dto) {
        return this.svc.update(ws, id, dto);
    }
    remove(ws, id) { return this.svc.remove(ws, id); }
};
exports.SegmentsController = SegmentsController;
__decorate([
    (0, common_1.Get)('schema'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "schema", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/count'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "count", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateSegmentDto]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('preview'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.PreviewSegmentDto]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "previewNew", null);
__decorate([
    (0, common_1.Post)(':id/preview'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.PreviewSegmentDto]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "preview", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateSegmentDto]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SegmentsController.prototype, "remove", null);
exports.SegmentsController = SegmentsController = __decorate([
    (0, common_1.Controller)('segments'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [segments_service_1.SegmentsService])
], SegmentsController);
