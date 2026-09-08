import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Contact, Segment } from '@/database/entities';
import { OPERATORS_BY_KIND, resolveField, SegmentRule } from './segment-rules';
import { CreateSegmentDto, UpdateSegmentDto } from './dto';

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment) private segments: Repository<Segment>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
  ) {}

  findAll(workspaceId: string) {
    return this.segments.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
  }

  async findOne(workspaceId: string, id: string) {
    const seg = await this.segments.findOne({ where: { id, workspaceId } });
    if (!seg) throw new NotFoundException('Segment not found');
    return seg;
  }

  async create(workspaceId: string, dto: CreateSegmentDto) {
    this.validateRules(dto.rules);
    return this.segments.save(this.segments.create({ ...dto, workspaceId }));
  }

  async update(workspaceId: string, id: string, dto: UpdateSegmentDto) {
    if (dto.rules) this.validateRules(dto.rules);
    await this.findOne(workspaceId, id);
    await this.segments.update(id, { ...dto, cachedCount: null } as any);
    return this.findOne(workspaceId, id);
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.segments.delete(id);
    return { message: 'Segment deleted' };
  }

  /** Dry-run a rule set: count + a small sample, used by the segment builder UI. */
  async preview(workspaceId: string, input: { matchType: 'all' | 'any'; rules: SegmentRule[] }) {
    this.validateRules(input.rules);
    const qb = this.baseQuery(workspaceId);
    this.applyRules(qb, input as Segment, 'c');
    const total = await qb.getCount();
    const sample = await qb.clone().take(10).getMany();
    return { total, sample };
  }

  async count(workspaceId: string, segmentId: string) {
    const seg = await this.findOne(workspaceId, segmentId);
    const qb = this.baseQuery(workspaceId);
    this.applyRules(qb, seg, 'c');
    const total = await qb.getCount();
    await this.segments.update(segmentId, { cachedCount: total, cachedAt: new Date() });
    return total;
  }

  baseQuery(workspaceId: string): SelectQueryBuilder<Contact> {
    return this.contacts.createQueryBuilder('c').where('c.workspace_id = :workspaceId', { workspaceId });
  }

  validateRules(rules: SegmentRule[]) {
    if (!Array.isArray(rules) || !rules.length) throw new BadRequestException('At least one rule is required');
    if (rules.length > 20) throw new BadRequestException('A segment can hold at most 20 rules');
    rules.forEach((rule, i) => {
      const resolved = resolveField(rule.field);
      if (!resolved) throw new BadRequestException(`Rule ${i + 1}: unknown field "${rule.field}"`);
      const allowed = OPERATORS_BY_KIND[resolved.kind];
      if (!allowed.includes(rule.operator)) {
        throw new BadRequestException(`Rule ${i + 1}: operator "${rule.operator}" is not allowed on "${rule.field}"`);
      }
    });
  }

  /**
   * Converts stored JSON rules into parameterised SQL.
   * Column names come from a whitelist; values are always bound.
   */
  applyRules(qb: SelectQueryBuilder<any>, segment: Pick<Segment, 'matchType' | 'rules'>, alias = 'c') {
    const rules = (segment.rules || []) as SegmentRule[];
    if (!rules.length) return qb;
    const joiner = segment.matchType === 'any' ? 'orWhere' : 'andWhere';

    qb.andWhere(new Brackets((w) => {
      rules.forEach((rule, i) => {
        const p = `sr${i}`;
        const resolved = resolveField(rule.field);
        if (!resolved) return;

        if (resolved.kind === 'relation') {
          const sub = this.relationSql(rule, alias, p);
          if (sub) w[joiner](sub.sql, sub.params);
          return;
        }

        const col = resolved.sql.replace('{alias}', alias);
        switch (rule.operator) {
          case 'equals':
            w[joiner](`${col} = :${p}`, { [p]: this.coerce(rule.value) }); break;
          case 'not_equals':
            w[joiner](`(${col} IS NULL OR ${col} <> :${p})`, { [p]: this.coerce(rule.value) }); break;
          case 'contains':
            w[joiner](`${col} LIKE :${p}`, { [p]: `%${rule.value}%` }); break;
          case 'not_contains':
            w[joiner](`(${col} IS NULL OR ${col} NOT LIKE :${p})`, { [p]: `%${rule.value}%` }); break;
          case 'starts_with':
            w[joiner](`${col} LIKE :${p}`, { [p]: `${rule.value}%` }); break;
          case 'is_set':
            w[joiner](`(${col} IS NOT NULL AND ${col} <> '')`); break;
          case 'is_not_set':
            w[joiner](`(${col} IS NULL OR ${col} = '')`); break;
          case 'before':
            w[joiner](`${col} < :${p}`, { [p]: new Date(rule.value) }); break;
          case 'after':
            w[joiner](`${col} > :${p}`, { [p]: new Date(rule.value) }); break;
        }
      });
    }));
    return qb;
  }

  private relationSql(rule: SegmentRule, alias: string, p: string): { sql: string; params: any } | null {
    const id = String(rule.value || '');
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) return null;

    switch (rule.operator) {
      case 'in_list':
        return { sql: `EXISTS (SELECT 1 FROM contact_list_members m WHERE m.contact_id = ${alias}.id AND m.list_id = :${p})`, params: { [p]: id } };
      case 'not_in_list':
        return { sql: `NOT EXISTS (SELECT 1 FROM contact_list_members m WHERE m.contact_id = ${alias}.id AND m.list_id = :${p})`, params: { [p]: id } };
      case 'opened_campaign':
        return { sql: `EXISTS (SELECT 1 FROM campaign_events e WHERE e.contact_id = ${alias}.id AND e.event_type = 'opened' AND e.campaign_id = :${p})`, params: { [p]: id } };
      case 'not_opened_campaign':
        return { sql: `NOT EXISTS (SELECT 1 FROM campaign_events e WHERE e.contact_id = ${alias}.id AND e.event_type = 'opened' AND e.campaign_id = :${p})`, params: { [p]: id } };
      case 'clicked_campaign':
        return { sql: `EXISTS (SELECT 1 FROM campaign_events e WHERE e.contact_id = ${alias}.id AND e.event_type = 'clicked' AND e.campaign_id = :${p})`, params: { [p]: id } };
      default:
        return null;
    }
  }

  private coerce(v: any) {
    if (v === 'true' || v === true) return 1;
    if (v === 'false' || v === false) return 0;
    return v;
  }
}
