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
var SmtpProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const dns = __importStar(require("dns/promises"));
const nodemailer = __importStar(require("nodemailer"));
const crypto_1 = require("crypto");
let SmtpProvider = SmtpProvider_1 = class SmtpProvider {
    config;
    name = 'smtp';
    logger = new common_1.Logger(SmtpProvider_1.name);
    transporter;
    constructor(config) {
        this.config = config;
        const smtp = this.config.get('email.smtp');
        this.transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
            pool: true,
            maxConnections: 5,
            maxMessages: 200,
        });
    }
    async send(input) {
        try {
            const info = await this.transporter.sendMail({
                from: `"${input.fromName}" <${input.fromEmail}>`,
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
            // 4xx SMTP codes are transient; 5xx are permanent.
            const code = err?.responseCode ?? 0;
            const retryable = code === 0 || (code >= 400 && code < 500);
            this.logger.warn(`SMTP send failed for ${input.to}: ${err.message}`);
            return { messageId: null, accepted: false, retryable, error: err.message };
        }
    }
    async getDomainRecords(domain) {
        return [
            { type: 'TXT', host: domain, value: 'v=spf1 include:_spf.yourprovider.com ~all', purpose: 'spf' },
            { type: 'TXT', host: `mailflow._domainkey.${domain}`, value: 'v=DKIM1; k=rsa; p=<your-dkim-public-key>', purpose: 'dkim' },
            { type: 'TXT', host: `_dmarc.${domain}`, value: 'v=DMARC1; p=none; rua=mailto:dmarc@' + domain, purpose: 'dmarc' },
            { type: 'CNAME', host: `mail.${domain}`, value: 'track.yourprovider.com', purpose: 'return-path' },
        ];
    }
    async checkDomain(domain) {
        try {
            const txt = (await dns.resolveTxt(domain).catch(() => [])).flat().join(' ');
            const dkim = (await dns.resolveTxt(`mailflow._domainkey.${domain}`).catch(() => [])).flat().join(' ');
            const verified = txt.includes('v=spf1') && dkim.includes('v=DKIM1');
            return { verified, details: { spf: txt.includes('v=spf1'), dkim: dkim.includes('v=DKIM1') } };
        }
        catch {
            return { verified: false };
        }
    }
    verifyWebhook(headers, rawBody) {
        const secret = this.config.get('webhookSecret');
        const sig = headers['x-mailflow-signature'];
        if (!sig)
            return false;
        const expected = (0, crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex');
        const a = Buffer.from(String(sig)), b = Buffer.from(expected);
        return a.length === b.length && (0, crypto_1.timingSafeEqual)(a, b);
    }
    parseWebhook(payload) {
        const events = Array.isArray(payload) ? payload : [payload];
        return events.map((e) => ({
            messageId: e.messageId || e['message-id'],
            email: e.email || e.recipient,
            type: String(e.event || e.type || '').toLowerCase(),
            timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
            raw: e,
        }));
    }
};
exports.SmtpProvider = SmtpProvider;
exports.SmtpProvider = SmtpProvider = SmtpProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmtpProvider);
