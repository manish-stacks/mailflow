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
exports.UnsubscribeController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const unsubscribe_service_1 = require("./unsubscribe.service");
class UnsubscribeDto {
    reason;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], UnsubscribeDto.prototype, "reason", void 0);
let UnsubscribeController = class UnsubscribeController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    info(token) { return this.svc.info(token); }
    unsubscribe(token, dto, req) {
        return this.svc.unsubscribe(token, dto?.reason, req.ip);
    }
    resubscribe(token) { return this.svc.resubscribe(token); }
};
exports.UnsubscribeController = UnsubscribeController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UnsubscribeController.prototype, "info", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UnsubscribeDto, Object]),
    __metadata("design:returntype", void 0)
], UnsubscribeController.prototype, "unsubscribe", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)(':token/resubscribe'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UnsubscribeController.prototype, "resubscribe", null);
exports.UnsubscribeController = UnsubscribeController = __decorate([
    (0, common_1.Controller)('unsubscribe'),
    __metadata("design:paramtypes", [unsubscribe_service_1.UnsubscribeService])
], UnsubscribeController);
