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
var MailConnectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailConnectionService = exports.PROVIDER_PRESETS = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nodemailer = __importStar(require("nodemailer"));
const entities_1 = require("../../database/entities");
const crypto_1 = require("../../common/crypto");
const billing_service_1 = require("../billing/billing.service");
/** Common providers, so clients pick a name instead of hunting for host/port. */
exports.PROVIDER_PRESETS = {
    gmail: {
        host: 'smtp.gmail.com', port: 587, secure: false,
        help: 'Use a Google App Password, not your account password. 2-Step Verification must be on.',
    },
    outlook: {
        host: 'smtp-mail.outlook.com', port: 587, secure: false,
        help: 'Microsoft 365 accounts may need SMTP AUTH enabled by an admin first.',
    },
    ses: {
        host: 'email-smtp.ap-south-1.amazonaws.com', port: 587, secure: false,
        help: 'Use SES SMTP credentials (not your AWS access keys) and verify the sending domain in SES.',
    },
    brevo: { host: 'smtp-relay.brevo.com', port: 587, secure: false, help: 'Find your SMTP key under SMTP & API in Brevo.' },
    sendgrid: { host: 'smtp.sendgrid.net', port: 587, secure: false, help: 'Username is literally "apikey"; the password is your API key.' },
    mailgun: { host: 'smtp.mailgun.org', port: 587, secure: false, help: 'Use the SMTP credentials from your Mailgun sending domain.' },
    smtp: { host: '', port: 587, secure: false, help: 'Any SMTP server. Port 587 with STARTTLS is the usual choice.' },
};
let MailConnectionService = MailConnectionService_1 = class MailConnectionService {
    repo;
    config;
    billing;
    logger = new common_1.Logger(MailConnectionService_1.name);
    /** transporter cache, keyed by workspace; invalidated whenever the row changes */
    cache = new Map();
    constructor(repo, config, billing) {
        this.repo = repo;
        this.config = config;
        this.billing = billing;
    }
    presets() {
        return Object.entries(exports.PROVIDER_PRESETS).map(([provider, v]) => ({ provider, ...v }));
    }
    /** Never returns the password, encrypted or otherwise. */
    safe(conn) {
        if (!conn)
            return null;
        const { passwordEnc, ...rest } = conn;
        return { ...rest, hasPassword: !!passwordEnc };
    }
    async find(workspaceId) {
        return this.safe(await this.repo.findOne({ where: { workspaceId } }));
    }
    async save(workspaceId, dto) {
        await this.billing.assertFeature(workspaceId, 'customSmtp');
        const preset = exports.PROVIDER_PRESETS[dto.provider ?? 'smtp'];
        const existing = await this.repo.findOne({ where: { workspaceId } });
        const host = dto.host || preset?.host;
        if (!host)
            throw new common_1.BadRequestException('An SMTP host is required');
        const payload = {
            workspaceId,
            label: dto.label ?? existing?.label ?? 'Primary',
            provider: (dto.provider ?? existing?.provider ?? 'smtp'),
            host,
            port: dto.port ?? preset?.port ?? 587,
            secure: dto.secure ?? (dto.port === 465),
            username: dto.username ?? existing?.username,
            fromName: dto.fromName ?? existing?.fromName,
            fromEmail: dto.fromEmail ?? existing?.fromEmail,
            dailyLimit: dto.dailyLimit ?? existing?.dailyLimit ?? 0,
            ratePerMinute: dto.ratePerMinute ?? existing?.ratePerMinute ?? 0,
            isActive: dto.isActive ?? existing?.isActive ?? true,
            // Blank password on an update means "keep the stored one".
            status: 'untested',
            lastError: null,
        };
        if (dto.password)
            payload.passwordEnc = (0, crypto_1.encryptSecret)(dto.password, this.config.get('encryptionKey'));
        if (existing)
            await this.repo.update(existing.id, payload);
        else
            await this.repo.save(this.repo.create(payload));
        this.cache.delete(workspaceId);
        return this.find(workspaceId);
    }
    async remove(workspaceId) {
        const existing = await this.repo.findOne({ where: { workspaceId } });
        if (!existing)
            throw new common_1.NotFoundException('No mail connection configured');
        await this.repo.delete(existing.id);
        this.cache.delete(workspaceId);
        return { message: 'Mail connection removed. Sending falls back to the platform mail server.' };
    }
    /** Opens a real connection and optionally sends a probe message. */
    async test(workspaceId, sendTo) {
        const conn = await this.repo.findOne({ where: { workspaceId } });
        if (!conn)
            throw new common_1.NotFoundException('No mail connection configured');
        const transporter = this.build(conn);
        try {
            await transporter.verify();
            if (sendTo) {
                await transporter.sendMail({
                    to: sendTo,
                    from: `"${conn.fromName || 'MailFlow'}" <${conn.fromEmail || conn.username}>`,
                    subject: 'MailFlow connection test',
                    text: 'If you are reading this, your mail connection works.',
                    html: '<p style="font-family:sans-serif">If you are reading this, your mail connection works.</p>',
                });
            }
            await this.repo.update(conn.id, { status: 'verified', lastError: null, lastTestedAt: new Date() });
            this.cache.delete(workspaceId);
            return { ok: true, message: sendTo ? `Connected — a test email was sent to ${sendTo}` : 'Connection successful' };
        }
        catch (err) {
            const message = String(err?.message ?? err).slice(0, 480);
            await this.repo.update(conn.id, { status: 'failed', lastError: message, lastTestedAt: new Date() });
            this.cache.delete(workspaceId);
            this.logger.warn(`Mail connection test failed for workspace ${workspaceId}: ${message}`);
            return { ok: false, message, hint: this.hint(message) };
        }
    }
    /** Turns the usual SMTP failures into something a client can act on. */
    hint(error) {
        const e = error.toLowerCase();
        if (e.includes('invalid login') || e.includes('535'))
            return 'The username or password was rejected. Gmail and Outlook need an app password, not the account password.';
        if (e.includes('etimedout') || e.includes('econnrefused'))
            return 'Could not reach the host. Check the hostname and port, and that outbound SMTP is not blocked.';
        if (e.includes('self signed') || e.includes('certificate'))
            return 'The server presented an untrusted certificate. Confirm the hostname is correct.';
        if (e.includes('5.7.') || e.includes('not authenticated'))
            return 'The server requires authentication before sending. Add a username and password.';
        return 'Check the host, port, encryption mode and credentials with your mail provider.';
    }
    build(conn) {
        const password = conn.passwordEnc ? (0, crypto_1.decryptSecret)(conn.passwordEnc, this.config.get('encryptionKey')) : null;
        return nodemailer.createTransport({
            host: conn.host,
            port: conn.port,
            secure: conn.secure || conn.port === 465,
            auth: conn.username ? { user: conn.username, pass: password ?? '' } : undefined,
            pool: true,
            maxConnections: 3,
            maxMessages: 100,
            connectionTimeout: 15000,
        });
    }
    /**
     * Returns the workspace's own transporter, or null to fall back to the platform.
     * A connection that last failed its test is not used — silently sending through a
     * broken relay is worse than sending through the platform default.
     */
    async transporterFor(workspaceId) {
        const conn = await this.repo.findOne({ where: { workspaceId } });
        if (!conn || !conn.isActive || conn.status === 'failed')
            return null;
        const key = `${conn.updatedAt?.getTime?.() ?? 0}:${conn.host}:${conn.port}:${conn.username}`;
        const hit = this.cache.get(workspaceId);
        if (hit?.key === key)
            return { transporter: hit.transporter, conn };
        hit?.transporter?.close?.();
        const transporter = this.build(conn);
        this.cache.set(workspaceId, { key, transporter });
        return { transporter, conn };
    }
};
exports.MailConnectionService = MailConnectionService;
exports.MailConnectionService = MailConnectionService = MailConnectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.EmailConnection)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        billing_service_1.BillingService])
], MailConnectionService);
