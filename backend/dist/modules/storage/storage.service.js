"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const entities_1 = require("../../database/entities");
/**
 * S3-compatible storage with a local-disk fallback so the app runs before
 * credentials exist. Metadata always lands in MySQL.
 */
let StorageService = StorageService_1 = class StorageService {
    config;
    files;
    logger = new common_1.Logger(StorageService_1.name);
    s3 = null;
    localDir = path.join(process.cwd(), '.storage');
    constructor(config, files) {
        this.config = config;
        this.files = files;
        const s3 = this.config.get('s3');
        if (s3.accessKey && s3.secretKey && s3.bucket) {
            this.s3 = new client_s3_1.S3Client({
                endpoint: s3.endpoint || undefined,
                region: s3.region,
                forcePathStyle: !!s3.endpoint,
                credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
            });
        }
        else {
            this.logger.warn('S3 not configured — falling back to local disk storage');
        }
    }
    async upload(params) {
        const s3cfg = this.config.get('s3');
        const key = `${params.workspaceId}/${params.purpose || 'image'}/${(0, crypto_1.randomUUID)()}-${params.fileName.replace(/[^\w.-]/g, '_')}`;
        let url;
        if (this.s3) {
            await this.s3.send(new client_s3_1.PutObjectCommand({
                Bucket: s3cfg.bucket, Key: key, Body: params.buffer, ContentType: params.mimeType,
            }));
            url = s3cfg.publicUrl ? `${s3cfg.publicUrl}/${key}` : `${s3cfg.endpoint}/${s3cfg.bucket}/${key}`;
        }
        else {
            const dest = path.join(this.localDir, key);
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.writeFile(dest, params.buffer);
            url = `${this.config.get('trackingBaseUrl')}/storage/${key}`;
        }
        return this.files.save(this.files.create({
            workspaceId: params.workspaceId,
            uploadedBy: params.userId,
            fileName: params.fileName,
            storageKey: key,
            url,
            mimeType: params.mimeType,
            sizeBytes: params.buffer.length,
            purpose: params.purpose || 'image',
        }));
    }
    async download(storageKey) {
        if (this.s3) {
            const res = await this.s3.send(new client_s3_1.GetObjectCommand({
                Bucket: this.config.get('s3.bucket'), Key: storageKey,
            }));
            const chunks = [];
            for await (const chunk of res.Body)
                chunks.push(Buffer.from(chunk));
            return Buffer.concat(chunks);
        }
        return fs.readFile(path.join(this.localDir, storageKey));
    }
    list(workspaceId, purpose) {
        return this.files.find({
            where: { workspaceId, ...(purpose ? { purpose } : {}) },
            order: { createdAt: 'DESC' }, take: 100,
        });
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.UploadedFile)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], StorageService);
