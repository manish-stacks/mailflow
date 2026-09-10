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
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const dns = __importStar(require("dns/promises"));
const entities_1 = require("../../database/entities");
const email_service_1 = require("../../integrations/email/email.service");
const billing_service_1 = require("../billing/billing.service");
const crypto_2 = require("../../common/crypto");
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;
/** Known mailbox providers' SPF "include:" mechanism, keyed by a pattern found
 *  in that provider's MX records — so we can auto-detect it instead of asking
 *  the client (who has no idea what "SPF include" even means). */
const MX_TO_SPF_INCLUDE = [
    { pattern: /\.hostinger\.com$/i, include: '_spf.mail.hostinger.com' },
    { pattern: /aspmx\.l\.google\.com$|googlemail\.com$/i, include: '_spf.google.com' },
    { pattern: /mail\.protection\.outlook\.com$/i, include: 'spf.protection.outlook.com' },
    { pattern: /\.zoho(\.eu|\.in)?\.com$/i, include: 'zoho.com' },
    { pattern: /secureserver\.net$/i, include: 'secureserver.net' },
];
let DomainsService = class DomainsService {
    domains;
    email;
    billing;
    config;
    constructor(domains, email, billing, config) {
        this.domains = domains;
        this.email = email;
        this.billing = billing;
        this.config = config;
    }
    findAll(workspaceId) {
        return this.domains.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
    }
    async findOne(workspaceId, id) {
        const d = await this.domains.findOne({ where: { id, workspaceId } });
        if (!d)
            throw new common_1.NotFoundException('Domain not found');
        return d;
    }
    /** Looks at the domain's actual MX records to figure out which mailbox
     *  provider it uses, so the SPF record we generate merges the right
     *  include automatically — no need to ask the client. Falls back to a
     *  plain SPF record (still valid, just without that provider's include)
     *  if we can't detect anything or the domain has no MX yet. */
    async detectSpfInclude(domain) {
        const resolveMx = async () => {
            try {
                const rows = await dns.resolveMx(domain);
                if (rows.length)
                    return rows.map((r) => r.exchange);
            }
            catch { /* fall through to public resolvers */ }
            for (const server of [['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']]) {
                try {
                    const resolver = new dns.Resolver();
                    resolver.setServers(server);
                    const rows = await resolver.resolveMx(domain);
                    if (rows.length)
                        return rows.map((r) => r.exchange);
                }
                catch { /* try next resolver */ }
            }
            return [];
        };
        const mxHosts = await resolveMx();
        for (const host of mxHosts) {
            const match = MX_TO_SPF_INCLUDE.find((m) => m.pattern.test(host));
            if (match)
                return match.include;
        }
        return null;
    }
    async create(workspaceId, domainInput) {
        await this.billing.assertQuota(workspaceId, 'domains');
        const domain = domainInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!DOMAIN_RE.test(domain))
            throw new common_1.BadRequestException('Enter a valid domain, e.g. example.com');
        const exists = await this.domains.findOne({ where: { workspaceId, domain } });
        if (exists)
            throw new common_1.BadRequestException('This domain has already been added');
        // Real per-domain DKIM keypair — replaces the old hardcoded placeholder.
        const selector = 'mailflow';
        const { publicKey, privateKey } = (0, crypto_1.generateKeyPairSync)('rsa', {
            modulusLength: 1024,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        const pubKeyB64 = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
        // Auto-detect the mailbox provider from the domain's own MX records, so the
        // SPF record we generate merges the right include without asking the client
        // (who won't know what "SPF include" even means). Falls back to a plain,
        // still-valid SPF record if nothing matches yet — MX may not be set up yet.
        const spfInclude = await this.detectSpfInclude(domain);
        const spfValue = spfInclude ? `v=spf1 a mx include:${spfInclude} ~all` : 'v=spf1 a mx ~all';
        const records = [
            { type: 'TXT', host: domain, value: spfValue, purpose: 'spf' },
            { type: 'TXT', host: `${selector}._domainkey.${domain}`, value: `v=DKIM1; k=rsa; p=${pubKeyB64}`, purpose: 'dkim' },
            { type: 'TXT', host: `_dmarc.${domain}`, value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, purpose: 'dmarc' },
        ];
        return this.domains.save(this.domains.create({
            workspaceId, domain, provider: this.email.provider.name,
            verificationRecords: records, verificationStatus: 'pending',
            dkimSelector: selector,
            dkimPrivateKeyEnc: (0, crypto_2.encryptSecret)(privateKey, this.config.get('encryptionKey')),
        }));
    }
    /** Checks the actual published DNS TXT records against what we generated.
     *  Falls back to public resolvers (Google/Cloudflare) if the server's own
     *  default DNS resolver is broken or hasn't caught up — common on VPS boxes. */
    async verify(workspaceId, id) {
        const d = await this.findOne(workspaceId, id);
        await this.domains.update(id, { verificationStatus: 'verifying', lastCheckedAt: new Date() });
        const dkimRecord = (d.verificationRecords || []).find((r) => r.purpose === 'dkim');
        const dkimHost = dkimRecord?.host ?? `${d.dkimSelector}._domainkey.${d.domain}`;
        const spfRecord = (d.verificationRecords || []).find((r) => r.purpose === 'spf');
        const lookupTxt = async (host) => {
            try {
                const rows = await dns.resolveTxt(host);
                if (rows.length)
                    return rows.flat();
            }
            catch { /* fall through to public resolvers */ }
            for (const server of [['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']]) {
                try {
                    const resolver = new dns.Resolver();
                    resolver.setServers(server);
                    const rows = await resolver.resolveTxt(host);
                    if (rows.length)
                        return rows.flat();
                }
                catch { /* try next resolver */ }
            }
            return [];
        };
        // MX may not have existed when the domain was first added. Re-detect now —
        // if we can identify the provider and our stored SPF record doesn't already
        // include it, refresh it automatically so the client never has to.
        if (spfRecord && !String(spfRecord.value).includes('include:')) {
            const spfInclude = await this.detectSpfInclude(d.domain);
            if (spfInclude) {
                spfRecord.value = `v=spf1 a mx include:${spfInclude} ~all`;
                await this.domains.update(id, { verificationRecords: d.verificationRecords });
            }
        }
        const spfTxt = (await lookupTxt(d.domain)).join(' ');
        const dkimTxt = (await lookupTxt(dkimHost)).join('');
        const spfOk = spfTxt.includes('v=spf1');
        const dkimOk = !!dkimRecord && dkimTxt.replace(/\s+/g, '') === String(dkimRecord.value).replace(/\s+/g, '');
        const verified = spfOk && dkimOk;
        await this.domains.update(id, {
            verificationStatus: verified ? 'verified' : 'failed',
            verifiedAt: verified ? new Date() : null,
            lastCheckedAt: new Date(),
        });
        return { ...(await this.findOne(workspaceId, id)), details: { spf: spfOk, dkim: dkimOk } };
    }
    async remove(workspaceId, id) {
        await this.findOne(workspaceId, id);
        await this.domains.delete(id);
        return { message: 'Domain removed' };
    }
};
exports.DomainsService = DomainsService;
exports.DomainsService = DomainsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.SenderDomain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        email_service_1.EmailService,
        billing_service_1.BillingService,
        config_1.ConfigService])
], DomainsService);
