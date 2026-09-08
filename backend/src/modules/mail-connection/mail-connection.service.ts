import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailConnection } from '@/database/entities';
import { decryptSecret, encryptSecret } from '@/common/crypto';
import { BillingService } from '@/modules/billing/billing.service';
import { SaveConnectionDto } from './dto';

/** Common providers, so clients pick a name instead of hunting for host/port. */
export const PROVIDER_PRESETS: Record<string, { host: string; port: number; secure: boolean; help: string }> = {
  gmail: {
    host: 'smtp.gmail.com', port: 587, secure: false,
    help: 'Use a Google App Password, not your account password. 2-Step Verification must be on.',
  },
  outlook: {
    host: 'smtp-mail.outlook.com', port: 587, secure: false,
    help: 'Microsoft 365 accounts may need SMTP AUTH enabled by an admin first.',
  },
  ses: {
    host: 'email-smtp.ap-south-1.amazonaws.com', port: 587, secure: false,
    help: 'Use SES SMTP credentials (not your AWS access keys) and verify the sending domain in SES.',
  },
  brevo: { host: 'smtp-relay.brevo.com', port: 587, secure: false, help: 'Find your SMTP key under SMTP & API in Brevo.' },
  sendgrid: { host: 'smtp.sendgrid.net', port: 587, secure: false, help: 'Username is literally "apikey"; the password is your API key.' },
  mailgun: { host: 'smtp.mailgun.org', port: 587, secure: false, help: 'Use the SMTP credentials from your Mailgun sending domain.' },
  smtp: { host: '', port: 587, secure: false, help: 'Any SMTP server. Port 587 with STARTTLS is the usual choice.' },
};

@Injectable()
export class MailConnectionService {
  private readonly logger = new Logger(MailConnectionService.name);
  /** transporter cache, keyed by workspace; invalidated whenever the row changes */
  private cache = new Map<string, { key: string; transporter: nodemailer.Transporter }>();

  constructor(
    @InjectRepository(EmailConnection) private repo: Repository<EmailConnection>,
    private config: ConfigService,
    private billing: BillingService,
  ) {}

  presets() {
    return Object.entries(PROVIDER_PRESETS).map(([provider, v]) => ({ provider, ...v }));
  }

  /** Never returns the password, encrypted or otherwise. */
  private safe(conn: EmailConnection | null) {
    if (!conn) return null;
    const { passwordEnc, ...rest } = conn;
    return { ...rest, hasPassword: !!passwordEnc };
  }

  async find(workspaceId: string) {
    return this.safe(await this.repo.findOne({ where: { workspaceId } }));
  }

  async save(workspaceId: string, dto: SaveConnectionDto) {
    await this.billing.assertFeature(workspaceId, 'customSmtp');

    const preset = PROVIDER_PRESETS[dto.provider ?? 'smtp'];
    const existing = await this.repo.findOne({ where: { workspaceId } });

    const host = dto.host || preset?.host;
    if (!host) throw new BadRequestException('An SMTP host is required');

    const payload: Partial<EmailConnection> = {
      workspaceId,
      label: dto.label ?? existing?.label ?? 'Primary',
      provider: (dto.provider ?? existing?.provider ?? 'smtp') as any,
      host,
      port: dto.port ?? preset?.port ?? 587,
      secure: dto.secure ?? (dto.port === 465),
      username: dto.username ?? existing?.username,
      fromName: dto.fromName ?? existing?.fromName,
      fromEmail: dto.fromEmail ?? existing?.fromEmail,
      dailyLimit: dto.dailyLimit ?? existing?.dailyLimit ?? 0,
      ratePerMinute: dto.ratePerMinute ?? existing?.ratePerMinute ?? 0,
      isActive: dto.isActive ?? existing?.isActive ?? true,
      // Blank password on an update means "keep the stored one".
      status: 'untested',
      lastError: null,
    };
    if (dto.password) payload.passwordEnc = encryptSecret(dto.password, this.config.get('encryptionKey'));

    if (existing) await this.repo.update(existing.id, payload);
    else await this.repo.save(this.repo.create(payload));

    this.cache.delete(workspaceId);
    return this.find(workspaceId);
  }

  async remove(workspaceId: string) {
    const existing = await this.repo.findOne({ where: { workspaceId } });
    if (!existing) throw new NotFoundException('No mail connection configured');
    await this.repo.delete(existing.id);
    this.cache.delete(workspaceId);
    return { message: 'Mail connection removed. Sending falls back to the platform mail server.' };
  }

  /** Opens a real connection and optionally sends a probe message. */
  async test(workspaceId: string, sendTo?: string) {
    const conn = await this.repo.findOne({ where: { workspaceId } });
    if (!conn) throw new NotFoundException('No mail connection configured');

    const transporter = this.build(conn);
    try {
      await transporter.verify();
      if (sendTo) {
        await transporter.sendMail({
          to: sendTo,
          from: `"${conn.fromName || 'MailFlow'}" <${conn.fromEmail || conn.username}>`,
          subject: 'MailFlow connection test',
          text: 'If you are reading this, your mail connection works.',
          html: '<p style="font-family:sans-serif">If you are reading this, your mail connection works.</p>',
        });
      }
      await this.repo.update(conn.id, { status: 'verified', lastError: null, lastTestedAt: new Date() });
      this.cache.delete(workspaceId);
      return { ok: true, message: sendTo ? `Connected — a test email was sent to ${sendTo}` : 'Connection successful' };
    } catch (err: any) {
      const message = String(err?.message ?? err).slice(0, 480);
      await this.repo.update(conn.id, { status: 'failed', lastError: message, lastTestedAt: new Date() });
      this.cache.delete(workspaceId);
      this.logger.warn(`Mail connection test failed for workspace ${workspaceId}: ${message}`);
      return { ok: false, message, hint: this.hint(message) };
    }
  }

  /** Turns the usual SMTP failures into something a client can act on. */
  private hint(error: string) {
    const e = error.toLowerCase();
    if (e.includes('invalid login') || e.includes('535')) return 'The username or password was rejected. Gmail and Outlook need an app password, not the account password.';
    if (e.includes('etimedout') || e.includes('econnrefused')) return 'Could not reach the host. Check the hostname and port, and that outbound SMTP is not blocked.';
    if (e.includes('self signed') || e.includes('certificate')) return 'The server presented an untrusted certificate. Confirm the hostname is correct.';
    if (e.includes('5.7.') || e.includes('not authenticated')) return 'The server requires authentication before sending. Add a username and password.';
    return 'Check the host, port, encryption mode and credentials with your mail provider.';
  }

  private build(conn: EmailConnection): nodemailer.Transporter {
    const password = conn.passwordEnc ? decryptSecret(conn.passwordEnc, this.config.get('encryptionKey')) : null;
    return nodemailer.createTransport({
      host: conn.host,
      port: conn.port,
      secure: conn.secure || conn.port === 465,
      auth: conn.username ? { user: conn.username, pass: password ?? '' } : undefined,
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 15000,
    });
  }

  /**
   * Returns the workspace's own transporter, or null to fall back to the platform.
   * A connection that last failed its test is not used — silently sending through a
   * broken relay is worse than sending through the platform default.
   */
  async transporterFor(workspaceId: string): Promise<{ transporter: nodemailer.Transporter; conn: EmailConnection } | null> {
    const conn = await this.repo.findOne({ where: { workspaceId } });
    if (!conn || !conn.isActive || conn.status === 'failed') return null;

    const key = `${conn.updatedAt?.getTime?.() ?? 0}:${conn.host}:${conn.port}:${conn.username}`;
    const hit = this.cache.get(workspaceId);
    if (hit?.key === key) return { transporter: hit.transporter, conn };

    hit?.transporter?.close?.();
    const transporter = this.build(conn);
    this.cache.set(workspaceId, { key, transporter });
    return { transporter, conn };
  }
}
