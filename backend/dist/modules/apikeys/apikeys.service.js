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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const tokens_1 = require("../../common/tokens");
const entities_1 = require("../../database/entities");
let ApiKeysService = class ApiKeysService {
    keys;
    constructor(keys) {
        this.keys = keys;
    }
    async findAll(workspaceId) {
        const rows = await this.keys.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
        return rows.map(({ keyHash, ...rest }) => rest); // the hash never leaves the server
    }
    /** The plaintext key is returned exactly once, at creation. */
    async create(workspaceId, userId, name, scopes = ['read']) {
        const secret = (0, tokens_1.randomToken)(24);
        const prefix = `mf_${secret.slice(0, 8)}`;
        const plain = `${prefix}.${secret}`;
        const key = await this.keys.save(this.keys.create({
            workspaceId, name, keyPrefix: prefix, keyHash: await bcrypt.hash(plain, 10), scopes, createdBy: userId,
        }));
        const { keyHash, ...rest } = key;
        return { ...rest, key: plain };
    }
    async revoke(workspaceId, id) {
        const key = await this.keys.findOne({ where: { id, workspaceId } });
        if (!key)
            throw new common_1.NotFoundException('API key not found');
        await this.keys.update(id, { revokedAt: new Date() });
        return { message: 'API key revoked' };
    }
    async validate(plain) {
        const prefix = plain.split('.')[0];
        const candidates = await this.keys.find({ where: { keyPrefix: prefix, revokedAt: (0, typeorm_2.IsNull)() } });
        for (const c of candidates) {
            if (await bcrypt.compare(plain, c.keyHash)) {
                await this.keys.update(c.id, { lastUsedAt: new Date() });
                return c;
            }
        }
        return null;
    }
};
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ApiKey)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ApiKeysService);
