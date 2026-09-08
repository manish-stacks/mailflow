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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const tokens_1 = require("../../common/tokens");
const email_service_1 = require("../../integrations/email/email.service");
const hashToken = (t) => (0, crypto_1.createHash)('sha256').update(t).digest('hex');
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace';
let AuthService = AuthService_1 = class AuthService {
    users;
    tokens;
    jwt;
    config;
    dataSource;
    email;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(users, tokens, jwt, config, dataSource, email) {
        this.users = users;
        this.tokens = tokens;
        this.jwt = jwt;
        this.config = config;
        this.dataSource = dataSource;
        this.email = email;
    }
    async register(dto, ctx = {}) {
        const exists = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
        if (exists)
            throw new common_1.ConflictException('An account with this email already exists');
        const verificationToken = (0, tokens_1.randomToken)(24);
        const user = await this.dataSource.transaction(async (m) => {
            const u = m.create(entities_1.User, {
                email: dto.email.toLowerCase(),
                passwordHash: await bcrypt.hash(dto.password, 12),
                firstName: dto.firstName,
                lastName: dto.lastName,
                verificationToken,
            });
            await m.save(u);
            // Every new user gets a first workspace so the product is usable immediately.
            const name = dto.workspaceName?.trim() || `${dto.firstName}'s Workspace`;
            const ws = m.create(entities_1.Workspace, { name, slug: `${slugify(name)}-${(0, tokens_1.randomToken)(3)}`, ownerId: u.id });
            await m.save(ws);
            await m.save(m.create(entities_1.WorkspaceMember, { workspaceId: ws.id, userId: u.id, role: 'owner', status: 'active' }));
            return u;
        });
        this.sendVerificationEmail(user.email, verificationToken).catch((e) => this.logger.warn(e.message));
        return this.issueSession(user, ctx);
    }
    async login(dto, ctx = {}) {
        const user = await this.users
            .createQueryBuilder('u').addSelect('u.passwordHash')
            .where('u.email = :email', { email: dto.email.toLowerCase() }).getOne();
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.users.update(user.id, { lastLoginAt: new Date() });
        return this.issueSession(user, ctx);
    }
    async refresh(rawToken, ctx = {}) {
        if (!rawToken)
            throw new common_1.UnauthorizedException('Missing refresh token');
        const record = await this.tokens.findOne({
            where: { tokenHash: hashToken(rawToken), expiresAt: (0, typeorm_2.MoreThan)(new Date()) },
            relations: ['user'],
        });
        if (!record || record.revokedAt)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        // Rotation: the presented token is burned and replaced.
        await this.tokens.update(record.id, { revokedAt: new Date() });
        return this.issueSession(record.user, ctx);
    }
    async logout(rawToken) {
        if (rawToken)
            await this.tokens.update({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
        return { message: 'Logged out' };
    }
    async forgotPassword(dto) {
        const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
        if (user) {
            const token = (0, tokens_1.randomToken)(24);
            await this.users.update(user.id, {
                resetToken: token,
                resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
            });
            const url = `${this.config.get('appBaseUrl')}/reset-password?token=${token}`;
            await this.email.sendSystem(user.email, 'Reset your MailFlow password', `<p>Reset your password using the link below. It expires in 1 hour.</p><p><a href="${url}">${url}</a></p>`)
                .catch((e) => this.logger.warn(e.message));
        }
        // Always the same answer — no account enumeration.
        return { message: 'If that email exists, a reset link has been sent' };
    }
    async resetPassword(dto) {
        const user = await this.users.createQueryBuilder('u')
            .addSelect(['u.resetToken', 'u.resetTokenExpiresAt'])
            .where('u.resetToken = :t', { t: dto.token }).getOne();
        if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
            throw new common_1.BadRequestException('Reset link is invalid or expired');
        }
        await this.users.update(user.id, {
            passwordHash: await bcrypt.hash(dto.password, 12),
            resetToken: null, resetTokenExpiresAt: null,
        });
        await this.tokens.update({ userId: user.id }, { revokedAt: new Date() });
        return { message: 'Password updated' };
    }
    async verifyEmail(token) {
        const user = await this.users.createQueryBuilder('u').addSelect('u.verificationToken')
            .where('u.verificationToken = :t', { t: token }).getOne();
        if (!user)
            throw new common_1.BadRequestException('Invalid verification token');
        await this.users.update(user.id, { emailVerified: true, verificationToken: null });
        return { message: 'Email verified' };
    }
    async me(userId) {
        const user = await this.users.findOne({ where: { id: userId } });
        const memberships = await this.dataSource.getRepository(entities_1.WorkspaceMember).find({
            where: { userId, status: 'active' }, relations: ['workspace'],
        });
        return {
            user,
            workspaces: memberships.map((m) => ({
                id: m.workspaceId, name: m.workspace?.name, slug: m.workspace?.slug,
                role: m.role, status: m.workspace?.status,
            })),
        };
    }
    async issueSession(user, ctx) {
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email }, { secret: this.config.get('jwt.accessSecret'), expiresIn: this.config.get('jwt.accessTtl') });
        const refreshToken = (0, tokens_1.randomToken)(48);
        const ttlDays = parseInt(this.config.get('jwt.refreshTtl'), 10) || 30;
        await this.tokens.save(this.tokens.create({
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + ttlDays * 864e5),
            ip: ctx.ip, userAgent: ctx.userAgent?.slice(0, 240),
        }));
        return {
            accessToken, refreshToken,
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: !!user.emailVerified },
        };
    }
    async sendVerificationEmail(email, token) {
        const url = `${this.config.get('appBaseUrl')}/verify-email?token=${token}`;
        await this.email.sendSystem(email, 'Verify your MailFlow email', `<p>Welcome to MailFlow. Confirm your address:</p><p><a href="${url}">${url}</a></p>`);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.RefreshToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.DataSource,
        email_service_1.EmailService])
], AuthService);
