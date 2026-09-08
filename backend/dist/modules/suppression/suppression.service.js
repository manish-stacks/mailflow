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
exports.SuppressionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const entities_1 = require("../../database/entities");
let SuppressionService = class SuppressionService {
    suppressions;
    contacts;
    constructor(suppressions, contacts) {
        this.suppressions = suppressions;
        this.contacts = contacts;
    }
    async findAll(workspaceId, q) {
        const qb = this.suppressions.createQueryBuilder('s').where('s.workspace_id = :workspaceId', { workspaceId });
        if (q.reason)
            qb.andWhere('s.reason = :reason', { reason: q.reason });
        if (q.search)
            qb.andWhere('s.email LIKE :s', { s: `%${q.search}%` });
        qb.orderBy('s.created_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_dto_1.paginate)(data, total, q.page, q.limit);
    }
    async add(workspaceId, emails, reason = 'manual') {
        const rows = emails.map((e) => ({ workspaceId, email: e.toLowerCase().trim(), reason, source: 'manual' }));
        await this.suppressions.createQueryBuilder().insert().values(rows).orIgnore().execute();
        await this.contacts.update({ workspaceId, email: (0, typeorm_2.In)(rows.map((r) => r.email)) }, { status: 'suppressed', subscribed: false });
        return { added: rows.length };
    }
    async remove(workspaceId, id) {
        const record = await this.suppressions.findOne({ where: { id, workspaceId } });
        if (record) {
            await this.suppressions.delete(id);
            await this.contacts.update({ workspaceId, email: record.email }, { status: 'active', subscribed: true });
        }
        return { message: 'Removed from suppression list' };
    }
    /** Bulk membership check used before any send. */
    async filter(workspaceId, emails) {
        if (!emails.length)
            return new Set();
        const rows = await this.suppressions.find({ where: { workspaceId, email: (0, typeorm_2.In)(emails) }, select: ['email'] });
        return new Set(rows.map((r) => r.email));
    }
};
exports.SuppressionService = SuppressionService;
exports.SuppressionService = SuppressionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Suppression)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SuppressionService);
