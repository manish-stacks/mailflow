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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const apikeys_service_1 = require("../../modules/apikeys/apikeys.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
/**
 * Accepts EITHER:
 *  - an API key via `x-api-key: mf_xxx.yyy` (or `Authorization: Bearer mf_xxx.yyy`), or
 *  - a normal logged-in session JWT (falls back to JwtAuthGuard).
 *
 * On API-key success it sets req.workspaceId directly from the key (no
 * x-workspace-id header needed) and marks req.apiKeyAuth so WorkspaceGuard
 * trusts it instead of doing a membership lookup.
 */
let ApiKeyAuthGuard = class ApiKeyAuthGuard extends jwt_auth_guard_1.JwtAuthGuard {
    apiKeys;
    constructor(reflector, apiKeys) {
        super(reflector);
        this.apiKeys = apiKeys;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const bearer = req.headers['authorization']?.startsWith('Bearer mf_')
            ? req.headers['authorization'].slice(7)
            : undefined;
        const rawKey = req.headers['x-api-key'] || bearer;
        if (rawKey) {
            const key = await this.apiKeys.validate(rawKey);
            if (!key)
                throw new common_1.UnauthorizedException('Invalid or revoked API key');
            req.user = { id: key.createdBy };
            req.workspaceId = key.workspaceId;
            req.apiKeyAuth = true;
            return true;
        }
        const result = super.canActivate(context);
        return (0, rxjs_1.isObservable)(result) ? (0, rxjs_1.firstValueFrom)(result) : result;
    }
};
exports.ApiKeyAuthGuard = ApiKeyAuthGuard;
exports.ApiKeyAuthGuard = ApiKeyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, apikeys_service_1.ApiKeysService])
], ApiKeyAuthGuard);
