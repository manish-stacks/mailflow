import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination.dto';
import { DEMO_STATUSES, DemoRequest } from '@/database/entities';
import { CreateDemoRequestDto, QueryDemoRequestsDto, UpdateDemoRequestDto } from './dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const blank = (v?: string | null) => (v && v.trim() ? v.trim() : null);

@Injectable()
export class DemoService {
  constructor(@InjectRepository(DemoRequest) private repo: Repository<DemoRequest>) {}

  /** Public landing-page submit. Always answers { received: true } so bots learn nothing. */
  async create(dto: CreateDemoRequestDto, meta: { ip?: string; userAgent?: string }) {
    if (dto.website) return { received: true }; // honeypot tripped — drop silently

    const email = dto.email.toLowerCase();
    const fields = {
      name: dto.name,
      company: blank(dto.company),
      teamSize: blank(dto.teamSize),
      interests: dto.interests?.length ? dto.interests : null,
      message: blank(dto.message),
      source: blank(dto.source) ?? 'landing',
      consent: true,
      ip: meta.ip?.slice(0, 64) ?? null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    };

    // Double-click / resubmit guard: same email still "new" within 24h updates the existing row.
    const existing = await this.repo.findOne({
      where: { email, status: 'new', createdAt: MoreThan(new Date(Date.now() - DAY_MS)) },
      order: { createdAt: 'DESC' },
    });
    if (existing) {
      await this.repo.update(existing.id, fields);
    } else {
      await this.repo.save(this.repo.create({ ...fields, email, status: 'new' }));
    }
    return { received: true };
  }

  async list(q: QueryDemoRequestsDto) {
    const qb = this.repo.createQueryBuilder('d').orderBy('d.createdAt', 'DESC');
    if (q.status) qb.andWhere('d.status = :status', { status: q.status });
    if (q.search) {
      qb.andWhere('(d.name LIKE :s OR d.email LIKE :s OR d.company LIKE :s)', { s: `%${q.search}%` });
    }
    const [rows, total] = await qb.skip((q.page - 1) * q.limit).take(q.limit).getManyAndCount();
    return paginate(rows, total, q.page, q.limit);
  }

  /** Counts per status for the filter chips. */
  async summary() {
    const rows: { status: string; n: string }[] = await this.repo
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(*)', 'n')
      .groupBy('d.status')
      .getRawMany();
    const out: Record<string, number> = { total: 0 };
    DEMO_STATUSES.forEach((s) => (out[s] = 0));
    rows.forEach((r) => { out[r.status] = +r.n; out.total += +r.n; });
    return out;
  }

  async update(id: string, dto: UpdateDemoRequestDto, userId: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Demo request not found');

    if (dto.notes !== undefined) row.notes = blank(dto.notes);
    if (dto.status && dto.status !== row.status) {
      row.status = dto.status;
      row.handledBy = userId;
      if (dto.status !== 'new' && !row.contactedAt) row.contactedAt = new Date();
    }
    return this.repo.save(row);
  }

  async remove(id: string) {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Demo request not found');
    return { deleted: true };
  }
}
