import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate, PaginationDto } from '@/common/dto/pagination.dto';
import { Contact, Suppression } from '@/database/entities';

@Injectable()
export class SuppressionService {
  constructor(
    @InjectRepository(Suppression) private suppressions: Repository<Suppression>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
  ) {}

  async findAll(workspaceId: string, q: PaginationDto & { reason?: string }) {
    const qb = this.suppressions.createQueryBuilder('s').where('s.workspace_id = :workspaceId', { workspaceId });
    if (q.reason) qb.andWhere('s.reason = :reason', { reason: q.reason });
    if (q.search) qb.andWhere('s.email LIKE :s', { s: `%${q.search}%` });
    qb.orderBy('s.created_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, q.page, q.limit);
  }

  async add(workspaceId: string, emails: string[], reason: any = 'manual') {
    const rows = emails.map((e) => ({ workspaceId, email: e.toLowerCase().trim(), reason, source: 'manual' }));
    await this.suppressions.createQueryBuilder().insert().values(rows).orIgnore().execute();
    await this.contacts.update({ workspaceId, email: In(rows.map((r) => r.email)) }, { status: 'suppressed', subscribed: false });
    return { added: rows.length };
  }

  async remove(workspaceId: string, id: string) {
    const record = await this.suppressions.findOne({ where: { id, workspaceId } });
    if (record) {
      await this.suppressions.delete(id);
      await this.contacts.update({ workspaceId, email: record.email }, { status: 'active', subscribed: true });
    }
    return { message: 'Removed from suppression list' };
  }

  /** Bulk membership check used before any send. */
  async filter(workspaceId: string, emails: string[]) {
    if (!emails.length) return new Set<string>();
    const rows = await this.suppressions.find({ where: { workspaceId, email: In(emails) }, select: ['email'] });
    return new Set(rows.map((r) => r.email));
  }
}
