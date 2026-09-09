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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mail_connection_service_1 = require("../../modules/mail-connection/mail-connection.service");
const entities_1 = require("../../database/entities");
const crypto_1 = require("../../common/crypto");
const smtp_provider_1 = require("./smtp.provider");
/**
 * Facade over the configured provider. Adding a provider later means registering it
 * in the constructor map — campaign code stays untouched.
 */
let EmailService = EmailService_1 = class EmailService {
    config;
    connections;
    domains;
    providers;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(config, smtp, connections, domains) {
        this.config = config;
        this.connections = connections;
        this.domains = domains;
        this.providers = { smtp };
    }
    get provider() {
        const name = this.config.get('email.provider') || 'smtp';
        return this.providers[name] || this.providers.smtp;
    }
    /** Attaches a DKIM signature from the workspace's verified sending domain, if any. */
    async attachDkim(input) {
        if (!input.workspaceId || !input.fromEmail?.includes('@'))
            return input;
        const domain = input.fromEmail.split('@')[1].toLowerCase();
        const d = await this.domains.findOne({ where: { workspaceId: input.workspaceId, domain, verificationStatus: 'verified' } });
        if (!d?.dkimPrivateKeyEnc)
            return input;
        const privateKey = (0, crypto_1.decryptSecret)(d.dkimPrivateKeyEnc, this.config.get('encryptionKey'));
        if (!privateKey)
            return input;
        return { ...input, dkim: { domainName: domain, keySelector: d.dkimSelector, privateKey } };
    }
    /**
     * Routing rule: a workspace with a working mail connection sends through its own
     * relay; everyone else uses the platform provider. Reputation therefore belongs to
     * whoever owns the relay, which is the point of letting clients connect their own.
     */
    async send(rawInput) {
        const input = await this.attachDkim(rawInput);
        if (input.workspaceId) {
            const owned = await this.connections.transporterFor(input.workspaceId);
            if (owned) {
                try {
                    const info = await owned.transporter.sendMail({
                        from: `"${input.fromName || owned.conn.fromName}" <${input.fromEmail || owned.conn.fromEmail}>`,
                        replyTo: input.replyTo || undefined,
                        to: input.to,
                        subject: input.subject,
                        html: input.html,
                        text: input.text,
                        headers: input.headers,
                        dkim: input.dkim,
                    });
                    return { messageId: info.messageId, accepted: (info.accepted?.length ?? 0) > 0 };
                }
                catch (err) {
                    const code = err?.responseCode ?? 0;
                    const retryable = code === 0 || (code >= 400 && code < 500);
                    this.logger.warn(`Workspace ${input.workspaceId} SMTP failed for ${input.to}: ${err.message}`);
                    return { messageId: null, accepted: false, retryable, error: err.message };
                }
            }
        }
        return this.provider.send(input);
    }
    /** Transactional mail from the platform itself (verification, resets, invites). */
    sendSystem(to, subject, html) {
        return this.provider.send({
            to, subject, html,
            fromName: 'MailFlow',
            fromEmail: this.config.get('email.from'),
        });
    }
    getDomainRecords(domain) { return this.provider.getDomainRecords(domain); }
    checkDomain(domain) { return this.provider.checkDomain(domain); }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.SenderDomain)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        smtp_provider_1.SmtpProvider,
        mail_connection_service_1.MailConnectionService,
        typeorm_2.Repository])
], EmailService);
