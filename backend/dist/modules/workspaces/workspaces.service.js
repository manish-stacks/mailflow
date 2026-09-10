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
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const tokens_1 = require("../../common/tokens");
const email_service_1 = require("../../integrations/email/email.service");
const billing_service_1 = require("../billing/billing.service");
const bcrypt = __importStar(require("bcrypt"));
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace';
let WorkspacesService = class WorkspacesService {
    workspaces;
    members;
    users;
    audit;
    dataSource;
    email;
    config;
    billing;
    constructor(workspaces, members, users, audit, dataSource, email, config, billing) {
        this.workspaces = workspaces;
        this.members = members;
        this.users = users;
        this.audit = audit;
        this.dataSource = dataSource;
        this.email = email;
        this.config = config;
        this.billing = billing;
    }
    async listForUser(userId) {
        const memberships = await this.members.find({ where: { userId, status: 'active' }, relations: ['workspace'] });
        return memberships
            .filter((m) => m.workspace && !m.workspace.deletedAt)
            .map((m) => ({ ...m.workspace, role: m.role }));
    }
    async create(userId, dto) {
        return this.dataSource.transaction(async (m) => {
            const ws = m.create(entities_1.Workspace, {
                name: dto.name,
                slug: `${slugify(dto.name)}-${(0, tokens_1.randomToken)(3)}`,
                ownerId: userId,
                timezone: dto.timezone || 'Asia/Kolkata',
            });
            await m.save(ws);
            await m.save(m.create(entities_1.WorkspaceMember, { workspaceId: ws.id, userId, role: 'owner', status: 'active' }));
            return { ...ws, role: 'owner' };
        });
    }
    async findOne(workspaceId) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        if (!ws)
            throw new common_1.NotFoundException('Workspace not found');
        return ws;
    }
    async update(workspaceId, dto, userId) {
        await this.workspaces.update(workspaceId, dto);
        await this.log(workspaceId, userId, 'workspace.updated', 'workspace', workspaceId, dto);
        return this.findOne(workspaceId);
    }
    async remove(workspaceId, userId) {
        const ws = await this.findOne(workspaceId);
        if (ws.ownerId !== userId)
            throw new common_1.ForbiddenException('Only the owner can delete a workspace');
        await this.workspaces.softDelete(workspaceId);
        await this.log(workspaceId, userId, 'workspace.deleted', 'workspace', workspaceId, null);
        return { message: 'Workspace deleted' };
    }
    // ---- team ----
    async listMembers(workspaceId) {
        const members = await this.members.find({ where: { workspaceId }, relations: ['user'] });
        return members.map((m) => ({
            id: m.id, workspaceId: m.workspaceId, userId: m.userId, role: m.role, status: m.status,
            invitedEmail: m.invitedEmail, createdAt: m.createdAt,
            user: m.user ? { id: m.user.id, email: m.user.email, firstName: m.user.firstName, lastName: m.user.lastName } : undefined,
        }));
    }
    async invite(workspaceId, dto, invitedBy) {
        await this.billing.assertQuota(workspaceId, 'members');
        const email = dto.email.toLowerCase();
        const user = await this.users.findOne({ where: { email } });
        if (user) {
            const existing = await this.members.findOne({ where: { workspaceId, userId: user.id } });
            if (existing)
                throw new common_1.BadRequestException('This person is already in the workspace');
            const m = await this.members.save(this.members.create({
                workspaceId, userId: user.id, role: dto.role, status: 'active', invitedEmail: email,
            }));
            await this.notify(email, workspaceId);
            await this.log(workspaceId, invitedBy, 'member.added', 'workspace_member', m.id, { email, role: dto.role });
            return m;
        }
        // No account yet — hold an invite the user claims after registering.
        const token = (0, tokens_1.randomToken)(24);
        const m = await this.members.save(this.members.create({
            workspaceId, userId: null, role: dto.role, status: 'invited', invitedEmail: email, inviteToken: token,
        }));
        await this.notify(email, workspaceId, token);
        return m;
    }
    async updateMember(workspaceId, memberId, dto, actorId) {
        const member = await this.members.findOne({ where: { id: memberId, workspaceId } });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        if (member.role === 'owner' && (dto.role || dto.status)) {
            throw new common_1.BadRequestException('The owner cannot be changed or disabled');
        }
        if (dto.role)
            await this.members.update(memberId, { role: dto.role });
        if (dto.status) {
            await this.members.update(memberId, { status: dto.status });
            if (dto.status === 'disabled' && member.userId) {
                // Also kill any active sessions so a disabled member is logged out immediately.
                await this.dataSource.getRepository(entities_1.RefreshToken).update({ userId: member.userId }, { revokedAt: new Date() });
            }
            await this.log(workspaceId, actorId, dto.status === 'disabled' ? 'member.disabled' : 'member.enabled', 'workspace_member', memberId, null);
        }
        if ((dto.firstName || dto.lastName) && member.userId) {
            await this.users.update(member.userId, {
                ...(dto.firstName ? { firstName: dto.firstName } : {}),
                ...(dto.lastName ? { lastName: dto.lastName } : {}),
            });
        }
        if (dto.role)
            await this.log(workspaceId, actorId, 'member.role_changed', 'workspace_member', memberId, dto);
        return { message: 'Member updated' };
    }
    /**
     * Creates a login and attaches it to this workspace in one step. If the person
     * already has a MailFlow account we attach that account rather than refusing —
     * one human, one login, many workspaces.
     */
    async createMemberLogin(workspaceId, dto, actorId) {
        await this.billing.assertQuota(workspaceId, 'members');
        const email = dto.email.toLowerCase().trim();
        let user = await this.users.findOne({ where: { email } });
        let generatedPassword = null;
        if (!user) {
            generatedPassword = dto.password || `mf-${(0, tokens_1.randomToken)(6)}`;
            user = await this.users.save(this.users.create({
                email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                passwordHash: await bcrypt.hash(generatedPassword, 12),
                emailVerified: true, // an admin vouched for this address
                mustChangePassword: true,
                createdBy: actorId,
            }));
        }
        const existing = await this.members.findOne({ where: { workspaceId, userId: user.id } });
        if (existing)
            throw new common_1.BadRequestException('This person is already in the workspace');
        const member = await this.members.save(this.members.create({
            workspaceId, userId: user.id, role: dto.role, status: 'active', invitedEmail: email,
        }));
        if (generatedPassword && dto.sendCredentials !== false) {
            const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
            await this.email.sendSystem(email, `Your MailFlow login for ${ws?.name}`, `<p>An account was created for you on <b>${ws?.name}</b>.</p>
         <p>Email: <b>${email}</b><br>Temporary password: <b>${generatedPassword}</b></p>
         <p>You will be asked to change it after signing in.</p>
         <p><a href="${this.config.get('appBaseUrl')}/login">Sign in to MailFlow</a></p>`).catch(() => null);
        }
        await this.log(workspaceId, actorId, 'member.created', 'workspace_member', member.id, { email, role: dto.role });
        return {
            id: member.id, role: member.role, status: member.status,
            email, firstName: user.firstName, lastName: user.lastName,
            // Returned once so an admin can hand it over if the email does not arrive.
            temporaryPassword: generatedPassword,
            createdAt: member.createdAt,
        };
    }
    /** Admin-initiated password reset for a member of this workspace. */
    async resetMemberPassword(workspaceId, memberId, actorId) {
        const member = await this.members.findOne({ where: { id: memberId, workspaceId }, relations: ['user'] });
        if (!member?.userId)
            throw new common_1.NotFoundException('Member not found');
        if (member.role === 'owner')
            throw new common_1.BadRequestException('The owner must reset their own password');
        const password = `mf-${(0, tokens_1.randomToken)(6)}`;
        await this.users.update(member.userId, {
            passwordHash: await bcrypt.hash(password, 12),
            mustChangePassword: true,
        });
        await this.log(workspaceId, actorId, 'member.password_reset', 'workspace_member', memberId, null);
        return { temporaryPassword: password, email: member.user?.email };
    }
    async removeMember(workspaceId, memberId, actorId) {
        const member = await this.members.findOne({ where: { id: memberId, workspaceId } });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        if (member.role === 'owner')
            throw new common_1.BadRequestException('The owner cannot be removed');
        await this.members.delete(memberId);
        await this.log(workspaceId, actorId, 'member.removed', 'workspace_member', memberId, null);
        return { message: 'Member removed' };
    }
    async auditLogs(workspaceId, limit = 100) {
        return this.audit.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: Math.min(limit, 200) });
    }
    async log(workspaceId, userId, action, entityType, entityId, metadata) {
        await this.audit.save(this.audit.create({ workspaceId, userId, action, entityType, entityId, metadata }));
    }
    async notify(email, workspaceId, token) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        const url = token
            ? `${this.config.get('appBaseUrl')}/register?invite=${token}`
            : `${this.config.get('appBaseUrl')}/dashboard`;
        await this.email.sendSystem(email, `You've been added to ${ws?.name} on MailFlow`, `<p>You now have access to <b>${ws?.name}</b>.</p><p><a href="${url}">Open MailFlow</a></p>`).catch(() => null);
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkspaceMember)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        email_service_1.EmailService,
        config_1.ConfigService,
        billing_service_1.BillingService])
], WorkspacesService);
