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
exports.WorkspaceGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const decorators_1 = require("../decorators");
const RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };
/**
 * Resolves the active workspace from the `x-workspace-id` header (or ?workspaceId)
 * and guarantees the authenticated user is an active member with a sufficient role.
 * This is the single choke point for tenant isolation.
 */
let WorkspaceGuard = class WorkspaceGuard {
    reflector;
    members;
    constructor(reflector, members) {
        this.reflector = reflector;
        this.members = members;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        // Request was already authenticated + scoped to a workspace via an API key
        // (see ApiKeyAuthGuard) — trust that instead of doing a membership lookup.
        if (req.apiKeyAuth)
            return true;
        const workspaceId = req.headers['x-workspace-id'] || req.query?.workspaceId;
        if (!workspaceId)
            throw new common_1.BadRequestException('Missing x-workspace-id header');
        if (!req.user?.id)
            throw new common_1.ForbiddenException();
        const membership = await this.members.findOne({
            where: { workspaceId, userId: req.user.id, status: 'active' },
        });
        if (!membership)
            throw new common_1.ForbiddenException('You do not have access to this workspace');
        const required = this.reflector.getAllAndOverride(decorators_1.ROLES_KEY, [
            ctx.getHandler(), ctx.getClass(),
        ]);
        if (required?.length) {
            const min = Math.min(...required.map((r) => RANK[r]));
            if (RANK[membership.role] < min)
                throw new common_1.ForbiddenException('Insufficient role');
        }
        req.workspaceId = workspaceId;
        req.membership = membership;
        return true;
    }
};
exports.WorkspaceGuard = WorkspaceGuard;
exports.WorkspaceGuard = WorkspaceGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkspaceMember)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository])
], WorkspaceGuard);
