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
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const storage_service_1 = require("./storage.service");
const ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'text/csv', 'application/vnd.ms-excel'];
let StorageController = class StorageController {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async upload(ws, userId, file, purpose = 'image') {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        if (!ALLOWED.includes(file.mimetype))
            throw new common_1.BadRequestException('Unsupported file type');
        return this.storage.upload({
            workspaceId: ws, userId, buffer: file.buffer,
            fileName: file.originalname, mimeType: file.mimetype, purpose,
        });
    }
    list(ws, purpose) { return this.storage.list(ws, purpose); }
    /** Local-disk fallback serving. With S3 configured, assets are served by the bucket/CDN. */
    async serve(params, res) {
        const key = params['0'];
        const buf = await this.storage.download(key);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(buf);
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('files/upload'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    (0, decorators_1.Roles)('editor'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 20 * 1024 * 1024 } })),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Query)('purpose')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('files'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Query)('purpose')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StorageController.prototype, "list", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('storage/*'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "serve", null);
exports.StorageController = StorageController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageController);
