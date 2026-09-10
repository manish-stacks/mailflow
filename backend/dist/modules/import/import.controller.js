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
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const workspace_guard_1 = require("../../common/guards/workspace.guard");
const storage_service_1 = require("../storage/storage.service");
const import_service_1 = require("./import.service");
class StartImportDto {
    fileId;
    listId;
    mapping;
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StartImportDto.prototype, "fileId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StartImportDto.prototype, "listId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], StartImportDto.prototype, "mapping", void 0);
let ImportController = class ImportController {
    svc;
    storage;
    constructor(svc, storage) {
        this.svc = svc;
        this.storage = storage;
    }
    /** Upload + parse in one call: stores the CSV and returns headers/sample for mapping. */
    async upload(ws, userId, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        if (!/\.csv$/i.test(file.originalname))
            throw new common_1.BadRequestException('Only .csv files are supported');
        const preview = await this.svc.preview(file.buffer);
        const stored = await this.storage.upload({
            workspaceId: ws, userId, buffer: file.buffer,
            fileName: file.originalname, mimeType: 'text/csv', purpose: 'csv',
        });
        return { fileId: stored.id, fileName: stored.fileName, ...preview };
    }
    start(ws, userId, dto) {
        return this.svc.start(ws, userId, dto);
    }
    list(ws) { return this.svc.findAll(ws); }
    status(ws, id) { return this.svc.findOne(ws, id); }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, decorators_1.Roles)('editor'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 50 * 1024 * 1024 } })),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('editor'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, StartImportDto]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "start", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, decorators_1.WorkspaceId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "status", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('contacts/import'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyAuthGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [import_service_1.ImportService, storage_service_1.StorageService])
], ImportController);
