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
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const entities_1 = require("../../database/entities");
const email_service_1 = require("../../integrations/email/email.service");
const renderer_1 = require("../../integrations/email/renderer");
let TemplatesService = class TemplatesService {
    templates;
    senders;
    email;
    config;
    constructor(templates, senders, email, config) {
        this.templates = templates;
        this.senders = senders;
        this.email = email;
        this.config = config;
    }
    async findAll(workspaceId, q) {
        const qb = this.templates.createQueryBuilder('t').where('t.workspace_id = :workspaceId', { workspaceId });
        if (q.category)
            qb.andWhere('t.category = :category', { category: q.category });
        if (q.search) {
            const s = `%${q.search}%`;
            qb.andWhere(new typeorm_2.Brackets((w) => w.where('t.name LIKE :s', { s }).orWhere('t.subject LIKE :s', { s })));
        }
        qb.orderBy('t.updated_at', 'DESC').skip((q.page - 1) * q.limit).take(q.limit);
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_dto_1.paginate)(data, total, q.page, q.limit);
    }
    async findOne(workspaceId, id) {
        const t = await this.templates.findOne({ where: { id, workspaceId } });
        if (!t)
            throw new common_1.NotFoundException('Template not found');
        return t;
    }
    create(workspaceId, userId, dto) {
        return this.templates.save(this.templates.create({ ...dto, workspaceId, createdBy: userId }));
    }
    async update(workspaceId, id, dto) {
        await this.findOne(workspaceId, id);
        await this.templates.update(id, dto);
        return this.findOne(workspaceId, id);
    }
    async duplicate(workspaceId, id, userId) {
        const t = await this.findOne(workspaceId, id);
        const { id: _id, createdAt, updatedAt, ...rest } = t;
        return this.templates.save(this.templates.create({ ...rest, name: `${t.name} (copy)`, createdBy: userId }));
    }
    async remove(workspaceId, id) {
        await this.findOne(workspaceId, id);
        await this.templates.softDelete(id);
        return { message: 'Template deleted' };
    }
    /** Test send with sample merge data so the author can check personalisation. */
    async sendTest(workspaceId, id, to, senderId) {
        const t = await this.findOne(workspaceId, id);
        const sender = senderId
            ? await this.senders.findOne({ where: { id: senderId, workspaceId } })
            : await this.senders.findOne({ where: { workspaceId, status: 'verified' } });
        const sample = { id: 'preview', email: to, firstName: 'Alex', lastName: 'Sharma', customAttributes: { company: 'CodeWins', city: 'Delhi' } };
        const html = (0, renderer_1.renderMergeTags)(t.htmlContent || '', sample);
        const subject = `[TEST] ${(0, renderer_1.renderMergeTags)(t.subject || t.name, sample)}`;
        const res = await this.email.send({
            to, subject, html, text: (0, renderer_1.htmlToText)(html),
            fromName: sender?.fromName || 'MailFlow',
            fromEmail: sender?.fromEmail || this.config.get('email.from'),
            replyTo: sender?.replyToEmail,
        });
        return { sent: res.accepted, error: res.error };
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.EmailTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SenderIdentity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService,
        config_1.ConfigService])
], TemplatesService);
