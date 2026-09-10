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

/** Known mailbox providers' SPF "include:" mechanism, keyed by a pattern found
 *  in that provider's MX records — so we can auto-detect it instead of asking
 *  the client (who has no idea what "SPF include" even means). */
const MX_TO_SPF_INCLUDE: { pattern: RegExp; include: string }[] = [
  { pattern: /\.hostinger\.com$/i, include: '_spf.mail.hostinger.com' },
  { pattern: /aspmx\.l\.google\.com$|googlemail\.com$/i, include: '_spf.google.com' },
  { pattern: /mail\.protection\.outlook\.com$/i, include: 'spf.protection.outlook.com' },
  { pattern: /\.zoho(\.eu|\.in)?\.com$/i, include: 'zoho.com' },
  { pattern: /secureserver\.net$/i, include: 'secureserver.net' },
];

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

  /** Looks at the domain's actual MX records to figure out which mailbox
   *  provider it uses, so the SPF record we generate merges the right
   *  include automatically — no need to ask the client. Falls back to a
   *  plain SPF record (still valid, just without that provider's include)
   *  if we can't detect anything or the domain has no MX yet. */
  private async detectSpfInclude(domain: string): Promise<string | null> {
    const resolveMx = async (): Promise<string[]> => {
      try {
        const rows = await dns.resolveMx(domain);
        if (rows.length) return rows.map((r) => r.exchange);
      } catch { /* fall through to public resolvers */ }
      for (const server of [['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']]) {
        try {
          const resolver = new dns.Resolver();
          resolver.setServers(server);
          const rows = await resolver.resolveMx(domain);
          if (rows.length) return rows.map((r) => r.exchange);
        } catch { /* try next resolver */ }
      }
      return [];
    };

    const mxHosts = await resolveMx();
    for (const host of mxHosts) {
      const match = MX_TO_SPF_INCLUDE.find((m) => m.pattern.test(host));
      if (match) return match.include;
    }
    return null;
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
    const spfRecord = (d.verificationRecords || []).find((r: any) => r.purpose === 'spf');

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

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.domains.delete(id);
    return { message: 'Domain removed' };
  }
}