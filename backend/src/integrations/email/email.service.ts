import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailConnectionService } from '@/modules/mail-connection/mail-connection.service';
import { SenderDomain } from '@/database/entities';
import { decryptSecret } from '@/common/crypto';
import { EmailProvider, SendEmailInput, SendEmailResult } from './email-provider.interface';
import { SmtpProvider } from './smtp.provider';

/**
 * Facade over the configured provider. Adding a provider later means registering it
 * in the constructor map — campaign code stays untouched.
 */
@Injectable()
export class EmailService {
  private readonly providers: Record<string, EmailProvider>;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private config: ConfigService,
    smtp: SmtpProvider,
    private connections: MailConnectionService,
    @InjectRepository(SenderDomain) private domains: Repository<SenderDomain>,
  ) {
    this.providers = { smtp };
  }

  get provider(): EmailProvider {
    const name = this.config.get('email.provider') || 'smtp';
    return this.providers[name] || this.providers.smtp;
  }

  /** Attaches a DKIM signature from the workspace's verified sending domain, if any. */
  private async attachDkim(input: SendEmailInput) {
    if (!input.workspaceId || !input.fromEmail?.includes('@')) return input;
    const domain = input.fromEmail.split('@')[1].toLowerCase();
    const d = await this.domains.findOne({ where: { workspaceId: input.workspaceId, domain, verificationStatus: 'verified' } });
    if (!d?.dkimPrivateKeyEnc) return input;
    const privateKey = decryptSecret(d.dkimPrivateKeyEnc, this.config.get('encryptionKey'));
    if (!privateKey) return input;
    return { ...input, dkim: { domainName: domain, keySelector: d.dkimSelector, privateKey } };
  }

  /**
   * Routing rule: a workspace with a working mail connection sends through its own
   * relay; everyone else uses the platform provider. Reputation therefore belongs to
   * whoever owns the relay, which is the point of letting clients connect their own.
   */
  async send(rawInput: SendEmailInput): Promise<SendEmailResult> {
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
        } catch (err: any) {
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
  sendSystem(to: string, subject: string, html: string) {
    return this.provider.send({
      to, subject, html,
      fromName: 'MailFlow',
      fromEmail: this.config.get('email.from'),
    });
  }

  getDomainRecords(domain: string) { return this.provider.getDomainRecords(domain); }
  checkDomain(domain: string) { return this.provider.checkDomain(domain); }
}
