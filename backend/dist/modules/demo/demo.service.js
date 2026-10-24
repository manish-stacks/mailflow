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
exports.DemoService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const entities_1 = require("../../database/entities");
const DAY_MS = 24 * 60 * 60 * 1000;
const blank = (v) => (v && v.trim() ? v.trim() : null);
let DemoService = class DemoService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    /** Public landing-page submit. Always answers { received: true } so bots learn nothing. */
    async create(dto, meta) {
        if (dto.website)
            return { received: true }; // honeypot tripped — drop silently
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
            where: { email, status: 'new', createdAt: (0, typeorm_2.MoreThan)(new Date(Date.now() - DAY_MS)) },
            order: { createdAt: 'DESC' },
        });
        if (existing) {
            await this.repo.update(existing.id, fields);
        }
        else {
            await this.repo.save(this.repo.create({ ...fields, email, status: 'new' }));
        }
        return { received: true };
    }
    async list(q) {
        const qb = this.repo.createQueryBuilder('d').orderBy('d.createdAt', 'DESC');
        if (q.status)
            qb.andWhere('d.status = :status', { status: q.status });
        if (q.search) {
            qb.andWhere('(d.name LIKE :s OR d.email LIKE :s OR d.company LIKE :s)', { s: `%${q.search}%` });
        }
        const [rows, total] = await qb.skip((q.page - 1) * q.limit).take(q.limit).getManyAndCount();
        return (0, pagination_dto_1.paginate)(rows, total, q.page, q.limit);
    }
    /** Counts per status for the filter chips. */
    async summary() {
        const rows = await this.repo
            .createQueryBuilder('d')
            .select('d.status', 'status')
            .addSelect('COUNT(*)', 'n')
            .groupBy('d.status')
            .getRawMany();
        const out = { total: 0 };
        entities_1.DEMO_STATUSES.forEach((s) => (out[s] = 0));
        rows.forEach((r) => { out[r.status] = +r.n; out.total += +r.n; });
        return out;
    }
    async update(id, dto, userId) {
        const row = await this.repo.findOne({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Demo request not found');
        if (dto.notes !== undefined)
            row.notes = blank(dto.notes);
        if (dto.status && dto.status !== row.status) {
            row.status = dto.status;
            row.handledBy = userId;
            if (dto.status !== 'new' && !row.contactedAt)
                row.contactedAt = new Date();
        }
        return this.repo.save(row);
    }
    async remove(id) {
        const res = await this.repo.delete(id);
        if (!res.affected)
            throw new common_1.NotFoundException('Demo request not found');
        return { deleted: true };
    }
};
exports.DemoService = DemoService;
exports.DemoService = DemoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.DemoRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DemoService);
