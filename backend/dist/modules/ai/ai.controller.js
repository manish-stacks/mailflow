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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const ai_service_1 = require("./ai.service");
const prompts_1 = require("./prompts");
class GenerateEmailDto {
    product;
    audience;
    goal;
    tone;
    keyPoints;
    offer;
    cta;
    brandName;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "product", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "audience", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "goal", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "tone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1500),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "keyPoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "offer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "cta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "brandName", void 0);
class GenerateSubjectDto {
    topic;
    tone;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], GenerateSubjectDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], GenerateSubjectDto.prototype, "tone", void 0);
class RewriteDto {
    action;
    content;
}
__decorate([
    (0, class_validator_1.IsIn)(Object.keys(prompts_1.REWRITE_ACTIONS)),
    __metadata("design:type", String)
], RewriteDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(20000),
    __metadata("design:type", String)
], RewriteDto.prototype, "content", void 0);
let AiController = class AiController {
    ai;
    constructor(ai) {
        this.ai = ai;
    }
    usage(ws) { return this.ai.usageSummary(ws); }
    generate(ws, uid, dto) {
        return this.ai.generateEmail(ws, uid, dto);
    }
    subjects(ws, uid, dto) {
        return this.ai.generateSubjects(ws, uid, dto.topic, dto.tone);
    }
    rewrite(ws, uid, dto) {
        return this.ai.rewrite(ws, uid, dto.action, dto.content);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('usage'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "usage", null);
__decorate([
    (0, common_1.Post)('generate-email'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, GenerateEmailDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)('generate-subject'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, GenerateSubjectDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "subjects", null);
__decorate([
    (0, common_1.Post)('rewrite'),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, RewriteDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "rewrite", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60_000 } }),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
