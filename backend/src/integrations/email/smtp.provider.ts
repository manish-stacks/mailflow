import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dns from 'dns/promises';
import * as nodemailer from 'nodemailer';
import { createHmac, timingSafeEqual } from 'crypto';
import { DomainVerificationRecord, EmailProvider, SendEmailInput, SendEmailResult } from './email-provider.interface';

@Injectable()
export class SmtpProvider implements EmailProvider {
  readonly name = 'smtp';
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
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

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${input.fromName}" <${input.fromEmail}>`,
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
      // 4xx SMTP codes are transient; 5xx are permanent.
      const code = err?.responseCode ?? 0;
      const retryable = code === 0 || (code >= 400 && code < 500);
      this.logger.warn(`SMTP send failed for ${input.to}: ${err.message}`);
      return { messageId: null, accepted: false, retryable, error: err.message };
    }
  }

  async getDomainRecords(domain: string): Promise<DomainVerificationRecord[]> {
    return [
      { type: 'TXT', host: domain, value: 'v=spf1 include:_spf.yourprovider.com ~all', purpose: 'spf' },
      { type: 'TXT', host: `mailflow._domainkey.${domain}`, value: 'v=DKIM1; k=rsa; p=<your-dkim-public-key>', purpose: 'dkim' },
      { type: 'TXT', host: `_dmarc.${domain}`, value: 'v=DMARC1; p=none; rua=mailto:dmarc@' + domain, purpose: 'dmarc' },
      { type: 'CNAME', host: `mail.${domain}`, value: 'track.yourprovider.com', purpose: 'return-path' },
    ];
  }

  async checkDomain(domain: string) {
    try {
      const txt = (await dns.resolveTxt(domain).catch(() => [])).flat().join(' ');
      const dkim = (await dns.resolveTxt(`mailflow._domainkey.${domain}`).catch(() => [])).flat().join(' ');
      const verified = txt.includes('v=spf1') && dkim.includes('v=DKIM1');
      return { verified, details: { spf: txt.includes('v=spf1'), dkim: dkim.includes('v=DKIM1') } };
    } catch {
      return { verified: false };
    }
  }

  verifyWebhook(headers: Record<string, any>, rawBody: string): boolean {
    const secret = this.config.get('webhookSecret');
    const sig = headers['x-mailflow-signature'];
    if (!sig) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(String(sig)), b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhook(payload: any) {
    const events = Array.isArray(payload) ? payload : [payload];
    return events.map((e) => ({
      messageId: e.messageId || e['message-id'],
      email: e.email || e.recipient,
      type: String(e.event || e.type || '').toLowerCase(),
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      raw: e,
    }));
  }
}
