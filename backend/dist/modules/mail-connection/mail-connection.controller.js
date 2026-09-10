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
exports.MailConnectionController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const mail_connection_service_1 = require("./mail-connection.service");
const dto_1 = require("./dto");
let MailConnectionController = class MailConnectionController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    find(ws) { return this.svc.find(ws); }
    presets() { return this.svc.presets(); }
    save(ws, dto) { return this.svc.save(ws, dto); }
    test(ws, dto) { return this.svc.test(ws, dto.sendTo); }
    remove(ws) { return this.svc.remove(ws); }
};
exports.MailConnectionController = MailConnectionController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MailConnectionController.prototype, "find", null);
__decorate([
    (0, common_1.Get)('presets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MailConnectionController.prototype, "presets", null);
__decorate([
    (0, common_1.Put)(),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SaveConnectionDto]),
    __metadata("design:returntype", void 0)
], MailConnectionController.prototype, "save", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TestConnectionDto]),
    __metadata("design:returntype", void 0)
], MailConnectionController.prototype, "test", null);
__decorate([
    (0, common_1.Delete)(),
    (0, decorators_1.Roles)('admin'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MailConnectionController.prototype, "remove", null);
exports.MailConnectionController = MailConnectionController = __decorate([
    (0, common_1.Controller)('mail-connection'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [mail_connection_service_1.MailConnectionService])
], MailConnectionController);
