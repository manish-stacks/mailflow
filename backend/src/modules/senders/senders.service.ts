import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SenderIdentity } from '@/database/entities';
import { randomToken } from '@/common/tokens';
import { EmailService } from '@/integrations/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';

@Injectable()
export class SendersService {
  constructor(
    @InjectRepository(SenderIdentity) private senders: Repository<SenderIdentity>,
    private email: EmailService,
    private config: ConfigService,
    private billing: BillingService,
  ) {}

  findAll(workspaceId: string) {
    return this.senders.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
  }

  async findOne(workspaceId: string, id: string) {
    const s = await this.senders.findOne({ where: { id, workspaceId } });
    if (!s) throw new NotFoundException('Sender identity not found');
    return s;
  }

  async create(workspaceId: string, dto: { fromName: string; fromEmail: string; replyToEmail?: string }) {
    await this.billing.assertQuota(workspaceId, 'senders');
    const fromEmail = dto.fromEmail.toLowerCase();
    const exists = await this.senders.findOne({ where: { workspaceId, fromEmail } });
    if (exists) throw new BadRequestException('This sender email already exists');

    const token = randomToken(20);
    const sender = await this.senders.save(this.senders.create({
      workspaceId, fromName: dto.fromName, fromEmail,
      replyToEmail: dto.replyToEmail?.toLowerCase(),
      verificationToken: token, status: 'pending',
    }));
    await this.sendVerification(sender).catch(() => null);
    return sender;
  }

  async update(workspaceId: string, id: string, dto: any) {
    await this.findOne(workspaceId, id);
    await this.senders.update(id, dto);
    return this.findOne(workspaceId, id);
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.senders.delete(id);
    return { message: 'Sender identity removed' };
  }

  async resend(workspaceId: string, id: string) {
    const sender = await this.findOne(workspaceId, id);
    if (sender.status === 'verified') throw new BadRequestException('Already verified');
    await this.sendVerification(sender);
    return { message: 'Verification email sent' };
  }

  async verify(token: string) {
    const sender = await this.senders.findOne({ where: { verificationToken: token } });
    if (!sender) throw new BadRequestException('Invalid verification link');
    await this.senders.update(sender.id, { status: 'verified', verifiedAt: new Date(), verificationToken: null });
    return { message: 'Sender verified', email: sender.fromEmail };
  }

  /** Campaign send gate. Dev installs can opt out via ALLOW_UNVERIFIED_SENDERS. */
  async assertSendable(workspaceId: string, senderId: string) {
    const sender = await this.findOne(workspaceId, senderId);
    if (sender.status !== 'verified' && !this.config.get('email.allowUnverifiedSenders')) {
      throw new BadRequestException(`Sender ${sender.fromEmail} is not verified`);
    }
    return sender;
  }

  private async sendVerification(sender: SenderIdentity) {
    const url = `${this.config.get('trackingBaseUrl')}/api/senders/verify?token=${sender.verificationToken}`;
    await this.email.sendSystem(sender.fromEmail, 'Verify your sender address',
      `<p>Confirm <b>${sender.fromEmail}</b> as a MailFlow sender:</p><p><a href="${url}">${url}</a></p>`);
  }
}
