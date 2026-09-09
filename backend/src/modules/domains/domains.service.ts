import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateKeyPairSync } from 'crypto';
import * as dns from 'dns/promises';
import { SenderDomain } from '@/database/entities';
import { EmailService } from '@/integrations/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';
import { encryptSecret } from '@/common/crypto';

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(SenderDomain) private domains: Repository<SenderDomain>,
    private email: EmailService,
    private billing: BillingService,
    private config: ConfigService,
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

    // Real per-domain DKIM keypair — replaces the old hardcoded placeholder.
    const selector = 'mailflow';
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const pubKeyB64 = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');

    const records = [
      { type: 'TXT', host: domain, value: 'v=spf1 a mx ~all', purpose: 'spf' },
      { type: 'TXT', host: `${selector}._domainkey.${domain}`, value: `v=DKIM1; k=rsa; p=${pubKeyB64}`, purpose: 'dkim' },
      { type: 'TXT', host: `_dmarc.${domain}`, value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, purpose: 'dmarc' },
    ];

    return this.domains.save(this.domains.create({
      workspaceId, domain, provider: this.email.provider.name,
      verificationRecords: records, verificationStatus: 'pending',
      dkimSelector: selector,
      dkimPrivateKeyEnc: encryptSecret(privateKey, this.config.get('encryptionKey')),
    }));
  }

  /** Checks the actual published DNS TXT records against what we generated.
   *  Falls back to public resolvers (Google/Cloudflare) if the server's own
   *  default DNS resolver is broken or hasn't caught up — common on VPS boxes. */
  async verify(workspaceId: string, id: string) {
    const d = await this.findOne(workspaceId, id);
    await this.domains.update(id, { verificationStatus: 'verifying', lastCheckedAt: new Date() });

    const dkimRecord = (d.verificationRecords || []).find((r: any) => r.purpose === 'dkim');
    const dkimHost = dkimRecord?.host ?? `${d.dkimSelector}._domainkey.${d.domain}`;

    const lookupTxt = async (host: string): Promise<string[]> => {
      try {
        const rows = await dns.resolveTxt(host);
        if (rows.length) return rows.flat();
      } catch { /* fall through to public resolvers */ }
      for (const server of [['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']]) {
        try {
          const resolver = new dns.Resolver();
          resolver.setServers(server);
          const rows = await resolver.resolveTxt(host);
          if (rows.length) return rows.flat();
        } catch { /* try next resolver */ }
      }
      return [];
    };

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

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.domains.delete(id);
    return { message: 'Domain removed' };
  }
}