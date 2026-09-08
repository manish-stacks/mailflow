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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mail_connection_service_1 = require("../../modules/mail-connection/mail-connection.service");
const smtp_provider_1 = require("./smtp.provider");
/**
 * Facade over the configured provider. Adding a provider later means registering it
 * in the constructor map — campaign code stays untouched.
 */
let EmailService = EmailService_1 = class EmailService {
    config;
    connections;
    providers;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(config, smtp, connections) {
        this.config = config;
        this.connections = connections;
        this.providers = { smtp };
    }
    get provider() {
        const name = this.config.get('email.provider') || 'smtp';
        return this.providers[name] || this.providers.smtp;
    }
    /**
     * Routing rule: a workspace with a working mail connection sends through its own
     * relay; everyone else uses the platform provider. Reputation therefore belongs to
     * whoever owns the relay, which is the point of letting clients connect their own.
     */
    async send(input) {
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
    __metadata("design:paramtypes", [config_1.ConfigService,
        smtp_provider_1.SmtpProvider,
        mail_connection_service_1.MailConnectionService])
], EmailService);
