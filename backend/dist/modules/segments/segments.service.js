"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const segment_rules_1 = require("./segment-rules");
let SegmentsService = class SegmentsService {
    segments;
    contacts;
    constructor(segments, contacts) {
        this.segments = segments;
        this.contacts = contacts;
    }
    findAll(workspaceId) {
        return this.segments.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
    }
    async findOne(workspaceId, id) {
        const seg = await this.segments.findOne({ where: { id, workspaceId } });
        if (!seg)
            throw new common_1.NotFoundException('Segment not found');
        return seg;
    }
    async create(workspaceId, dto) {
        this.validateRules(dto.rules);
        return this.segments.save(this.segments.create({ ...dto, workspaceId }));
    }
    async update(workspaceId, id, dto) {
        if (dto.rules)
            this.validateRules(dto.rules);
        await this.findOne(workspaceId, id);
        await this.segments.update(id, { ...dto, cachedCount: null });
        return this.findOne(workspaceId, id);
    }
    async remove(workspaceId, id) {
        await this.findOne(workspaceId, id);
        await this.segments.delete(id);
        return { message: 'Segment deleted' };
    }
    /** Dry-run a rule set: count + a small sample, used by the segment builder UI. */
    async preview(workspaceId, input) {
        this.validateRules(input.rules);
        const qb = this.baseQuery(workspaceId);
        this.applyRules(qb, input, 'c');
        const total = await qb.getCount();
        const sample = await qb.clone().take(10).getMany();
        return { total, sample };
    }
    async count(workspaceId, segmentId) {
        const seg = await this.findOne(workspaceId, segmentId);
        const qb = this.baseQuery(workspaceId);
        this.applyRules(qb, seg, 'c');
        const total = await qb.getCount();
        await this.segments.update(segmentId, { cachedCount: total, cachedAt: new Date() });
        return total;
    }
    baseQuery(workspaceId) {
        return this.contacts.createQueryBuilder('c').where('c.workspace_id = :workspaceId', { workspaceId });
    }
    validateRules(rules) {
        if (!Array.isArray(rules) || !rules.length)
            throw new common_1.BadRequestException('At least one rule is required');
        if (rules.length > 20)
            throw new common_1.BadRequestException('A segment can hold at most 20 rules');
        rules.forEach((rule, i) => {
            const resolved = (0, segment_rules_1.resolveField)(rule.field);
            if (!resolved)
                throw new common_1.BadRequestException(`Rule ${i + 1}: unknown field "${rule.field}"`);
            const allowed = segment_rules_1.OPERATORS_BY_KIND[resolved.kind];
            if (!allowed.includes(rule.operator)) {
                throw new common_1.BadRequestException(`Rule ${i + 1}: operator "${rule.operator}" is not allowed on "${rule.field}"`);
            }
        });
    }
    /**
     * Converts stored JSON rules into parameterised SQL.
     * Column names come from a whitelist; values are always bound.
     */
    applyRules(qb, segment, alias = 'c') {
        const rules = (segment.rules || []);
        if (!rules.length)
            return qb;
        const joiner = segment.matchType === 'any' ? 'orWhere' : 'andWhere';
        qb.andWhere(new typeorm_2.Brackets((w) => {
            rules.forEach((rule, i) => {
                const p = `sr${i}`;
                const resolved = (0, segment_rules_1.resolveField)(rule.field);
                if (!resolved)
                    return;
                if (resolved.kind === 'relation') {
                    const sub = this.relationSql(rule, alias, p);
                    if (sub)
                        w[joiner](sub.sql, sub.params);
                    return;
                }
                const col = resolved.sql.replace('{alias}', alias);
                switch (rule.operator) {
                    case 'equals':
                        w[joiner](`${col} = :${p}`, { [p]: this.coerce(rule.value) });
                        break;
                    case 'not_equals':
                        w[joiner](`(${col} IS NULL OR ${col} <> :${p})`, { [p]: this.coerce(rule.value) });
                        break;
                    case 'contains':
                        w[joiner](`${col} LIKE :${p}`, { [p]: `%${rule.value}%` });
                        break;
                    case 'not_contains':
                        w[joiner](`(${col} IS NULL OR ${col} NOT LIKE :${p})`, { [p]: `%${rule.value}%` });
                        break;
                    case 'starts_with':
                        w[joiner](`${col} LIKE :${p}`, { [p]: `${rule.value}%` });
                        break;
                    case 'is_set':
                        w[joiner](`(${col} IS NOT NULL AND ${col} <> '')`);
                        break;
                    case 'is_not_set':
                        w[joiner](`(${col} IS NULL OR ${col} = '')`);
                        break;
                    case 'before':
                        w[joiner](`${col} < :${p}`, { [p]: new Date(rule.value) });
                        break;
                    case 'after':
                        w[joiner](`${col} > :${p}`, { [p]: new Date(rule.value) });
                        break;
                }
            });
        }));
        return qb;
    }
    relationSql(rule, alias, p) {
        const id = String(rule.value || '');
        if (!/^[0-9a-fA-F-]{36}$/.test(id))
            return null;
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
    coerce(v) {
        if (v === 'true' || v === true)
            return 1;
        if (v === 'false' || v === false)
            return 0;
        return v;
    }
};
exports.SegmentsService = SegmentsService;
exports.SegmentsService = SegmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Segment)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SegmentsService);
