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
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const email_service_1 = require("../../integrations/email/email.service");
const billing_service_1 = require("../billing/billing.service");
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;
let DomainsService = class DomainsService {
    domains;
    email;
    billing;
    constructor(domains, email, billing) {
        this.domains = domains;
        this.email = email;
        this.billing = billing;
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
    async create(workspaceId, domainInput) {
        await this.billing.assertQuota(workspaceId, 'domains');
        const domain = domainInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!DOMAIN_RE.test(domain))
            throw new common_1.BadRequestException('Enter a valid domain, e.g. example.com');
        const exists = await this.domains.findOne({ where: { workspaceId, domain } });
        if (exists)
            throw new common_1.BadRequestException('This domain has already been added');
        const records = await this.email.getDomainRecords(domain);
        return this.domains.save(this.domains.create({
            workspaceId, domain, provider: this.email.provider.name,
            verificationRecords: records, verificationStatus: 'pending',
        }));
    }
    async verify(workspaceId, id) {
        const d = await this.findOne(workspaceId, id);
        await this.domains.update(id, { verificationStatus: 'verifying', lastCheckedAt: new Date() });
        const result = await this.email.checkDomain(d.domain);
        const status = result.verified ? 'verified' : 'failed';
        await this.domains.update(id, {
            verificationStatus: status,
            verifiedAt: result.verified ? new Date() : null,
            lastCheckedAt: new Date(),
        });
        return { ...(await this.findOne(workspaceId, id)), details: result.details };
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
        billing_service_1.BillingService])
], DomainsService);
