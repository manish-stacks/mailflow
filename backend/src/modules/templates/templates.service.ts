import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { paginate, PaginationDto } from '@/common/dto/pagination.dto';
import { EmailTemplate, SenderIdentity } from '@/database/entities';
import { EmailService } from '@/integrations/email/email.service';
import { htmlToText, renderMergeTags } from '@/integrations/email/renderer';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(EmailTemplate) private templates: Repository<EmailTemplate>,
    @InjectRepository(SenderIdentity) private senders: Repository<SenderIdentity>,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async findAll(workspaceId: string, q: PaginationDto & { category?: string }) {
    const qb = this.templates.createQueryBuilder('t').where('t.workspace_id = :workspaceId', { workspaceId });
    if (q.category) qb.andWhere('t.category = :category', { category: q.category });
    if (q.search) {
      const s = `%${q.search}%`;
      qb.andWhere(new Brackets((w) => w.where('t.name LIKE :s', { s }).orWhere('t.subject LIKE :s', { s })));
    }
    qb.orderBy('t.updated_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, q.page, q.limit);
  }

  async findOne(workspaceId: string, id: string) {
    const t = await this.templates.findOne({ where: { id, workspaceId } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  create(workspaceId: string, userId: string, dto: any) {
    return this.templates.save(this.templates.create({ ...dto, workspaceId, createdBy: userId }));
  }

  async update(workspaceId: string, id: string, dto: any) {
    await this.findOne(workspaceId, id);
    await this.templates.update(id, dto);
    return this.findOne(workspaceId, id);
  }

  async duplicate(workspaceId: string, id: string, userId: string) {
    const t = await this.findOne(workspaceId, id);
    const { id: _id, createdAt, updatedAt, ...rest } = t as any;
    return this.templates.save(this.templates.create({ ...rest, name: `${t.name} (copy)`, createdBy: userId }));
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.templates.softDelete(id);
    return { message: 'Template deleted' };
  }

  /** Test send with sample merge data so the author can check personalisation. */
  async sendTest(workspaceId: string, id: string, to: string, senderId?: string) {
    const t = await this.findOne(workspaceId, id);
    const sender = senderId
      ? await this.senders.findOne({ where: { id: senderId, workspaceId } })
      : await this.senders.findOne({ where: { workspaceId, status: 'verified' } });

    const sample = { id: 'preview', email: to, firstName: 'FirstName', lastName: 'LastName', customAttributes: { company: 'Workspace ', city: 'City' } };
    const html = renderMergeTags(t.htmlContent || '', sample);
    const subject = `[TEST] ${renderMergeTags(t.subject || t.name, sample)}`;

    const res = await this.email.send({
      to, subject, html, text: htmlToText(html),
      fromName: sender?.fromName || 'MailFlow',
      fromEmail: sender?.fromEmail || this.config.get('email.from'),
      replyTo: sender?.replyToEmail,
    });
    return { sent: res.accepted, error: res.error };
  }
}
