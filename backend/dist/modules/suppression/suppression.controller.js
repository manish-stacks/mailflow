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
exports.SuppressionController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const suppression_service_1 = require("./suppression.service");
class AddSuppressionDto {
    emails;
    reason;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(1000),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], AddSuppressionDto.prototype, "emails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unsubscribe', 'hard_bounce', 'complaint', 'manual']),
    __metadata("design:type", String)
], AddSuppressionDto.prototype, "reason", void 0);
class QuerySuppressionsDto extends pagination_dto_1.PaginationDto {
    reason;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySuppressionsDto.prototype, "reason", void 0);
let SuppressionController = class SuppressionController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(ws, q) { return this.svc.findAll(ws, q); }
    add(ws, dto) { return this.svc.add(ws, dto.emails, dto.reason); }
    remove(ws, id) { return this.svc.remove(ws, id); }
};
exports.SuppressionController = SuppressionController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, QuerySuppressionsDto]),
    __metadata("design:returntype", void 0)
], SuppressionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddSuppressionDto]),
    __metadata("design:returntype", void 0)
], SuppressionController.prototype, "add", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SuppressionController.prototype, "remove", null);
exports.SuppressionController = SuppressionController = __decorate([
    (0, common_1.Controller)('suppressions'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [suppression_service_1.SuppressionService])
], SuppressionController);
