import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SenderDomain } from '@/database/entities';
import { EmailService } from '@/integrations/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(SenderDomain) private domains: Repository<SenderDomain>,
    private email: EmailService,
    private billing: BillingService,
  ) {}

  findAll(workspaceId: string) {
    return this.domains.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
  }

  async findOne(workspaceId: string, id: string) {
    const d = await this.domains.findOne({ where: { id, workspaceId } });
    if (!d) throw new NotFoundException('Domain not found');
    return d;
  }

  async create(workspaceId: string, domainInput: string) {
    await this.billing.assertQuota(workspaceId, 'domains');
    const domain = domainInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!DOMAIN_RE.test(domain)) throw new BadRequestException('Enter a valid domain, e.g. example.com');
    const exists = await this.domains.findOne({ where: { workspaceId, domain } });
    if (exists) throw new BadRequestException('This domain has already been added');

    const records = await this.email.getDomainRecords(domain);
    return this.domains.save(this.domains.create({
      workspaceId, domain, provider: this.email.provider.name,
      verificationRecords: records, verificationStatus: 'pending',
    }));
  }

  async verify(workspaceId: string, id: string) {
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

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.domains.delete(id);
    return { message: 'Domain removed' };
  }
}
