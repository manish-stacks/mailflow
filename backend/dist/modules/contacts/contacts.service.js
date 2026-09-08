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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const entities_1 = require("../../database/entities");
const segments_service_1 = require("../segments/segments.service");
const billing_service_1 = require("../billing/billing.service");
let ContactsService = class ContactsService {
    contacts;
    lists;
    listMembers;
    suppressions;
    unsubs;
    events;
    segments;
    dataSource;
    billing;
    constructor(contacts, lists, listMembers, suppressions, unsubs, events, segments, dataSource, billing) {
        this.contacts = contacts;
        this.lists = lists;
        this.listMembers = listMembers;
        this.suppressions = suppressions;
        this.unsubs = unsubs;
        this.events = events;
        this.segments = segments;
        this.dataSource = dataSource;
        this.billing = billing;
    }
    async findAll(workspaceId, q) {
        const qb = this.contacts.createQueryBuilder('c').where('c.workspace_id = :workspaceId', { workspaceId });
        if (q.status)
            qb.andWhere('c.status = :status', { status: q.status });
        if (q.search) {
            const s = `%${q.search.trim()}%`;
            qb.andWhere(new typeorm_2.Brackets((w) => {
                w.where('c.email LIKE :s', { s })
                    .orWhere('c.first_name LIKE :s', { s })
                    .orWhere('c.last_name LIKE :s', { s });
            }));
        }
        if (q.listId) {
            qb.innerJoin(entities_1.ContactListMember, 'clm', 'clm.contact_id = c.id AND clm.list_id = :listId', { listId: q.listId });
        }
        if (q.segmentId) {
            const seg = await this.segments.findOne(workspaceId, q.segmentId);
            this.segments.applyRules(qb, seg, 'c');
        }
        const sortable = ['created_at', 'updated_at', 'email', 'status'];
        const sortBy = sortable.includes(q.sortBy) ? q.sortBy : 'created_at';
        qb.orderBy(`c.${sortBy}`, q.sortOrder?.toUpperCase() || 'DESC')
            .skip((q.page - 1) * q.limit).take(q.limit);
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_dto_1.paginate)(data, total, q.page, q.limit);
    }
    async findOne(workspaceId, id) {
        const contact = await this.contacts.findOne({ where: { id, workspaceId } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        const lists = await this.dataSource.query(`SELECT l.id, l.name FROM contact_list_members m JOIN contact_lists l ON l.id = m.list_id WHERE m.contact_id = ?`, [id]);
        return { ...contact, lists };
    }
    async activity(workspaceId, id) {
        return this.events.find({
            where: { workspaceId, contactId: id },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async create(workspaceId, dto) {
        await this.billing.assertQuota(workspaceId, 'contacts');
        const email = dto.email.toLowerCase().trim();
        const existing = await this.contacts.findOne({ where: { workspaceId, email } });
        if (existing)
            throw new common_1.BadRequestException('A contact with this email already exists');
        const suppressed = await this.suppressions.findOne({ where: { workspaceId, email } });
        const contact = await this.contacts.save(this.contacts.create({
            workspaceId, email,
            firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
            customAttributes: dto.customAttributes || {},
            status: suppressed ? 'suppressed' : 'active',
            subscribed: !suppressed,
        }));
        if (dto.listIds?.length)
            await this.addToLists([contact.id], dto.listIds);
        return contact;
    }
    async update(workspaceId, id, dto) {
        const contact = await this.contacts.findOne({ where: { id, workspaceId } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        if (dto.status === 'unsubscribed' || dto.subscribed === false) {
            await this.suppress(workspaceId, contact.email, 'unsubscribe', 'manual');
        }
        await this.contacts.update(id, dto);
        return this.contacts.findOne({ where: { id } });
    }
    async remove(workspaceId, id) {
        const res = await this.contacts.delete({ id, workspaceId });
        if (!res.affected)
            throw new common_1.NotFoundException('Contact not found');
        return { message: 'Contact deleted' };
    }
    async bulk(workspaceId, dto) {
        const contacts = await this.contacts.find({ where: { workspaceId, id: (0, typeorm_2.In)(dto.contactIds) } });
        const ids = contacts.map((c) => c.id);
        if (!ids.length)
            return { affected: 0 };
        switch (dto.action) {
            case 'delete':
                await this.contacts.delete({ id: (0, typeorm_2.In)(ids) });
                break;
            case 'unsubscribe':
                await this.contacts.update({ id: (0, typeorm_2.In)(ids) }, { status: 'unsubscribed', subscribed: false });
                for (const c of contacts)
                    await this.suppress(workspaceId, c.email, 'unsubscribe', 'bulk');
                break;
            case 'add_to_list':
                if (!dto.listId)
                    throw new common_1.BadRequestException('listId is required');
                await this.addToLists(ids, [dto.listId]);
                break;
            case 'remove_from_list':
                if (!dto.listId)
                    throw new common_1.BadRequestException('listId is required');
                await this.listMembers.delete({ listId: dto.listId, contactId: (0, typeorm_2.In)(ids) });
                await this.recountList(dto.listId);
                break;
        }
        return { affected: ids.length };
    }
    async addToLists(contactIds, listIds) {
        const rows = listIds.flatMap((listId) => contactIds.map((contactId) => ({ listId, contactId })));
        if (!rows.length)
            return;
        await this.listMembers.createQueryBuilder().insert().values(rows).orIgnore().execute();
        for (const listId of listIds)
            await this.recountList(listId);
    }
    async recountList(listId) {
        const count = await this.listMembers.count({ where: { listId } });
        await this.lists.update(listId, { contactCount: count });
    }
    /** Central suppression writer — every unsubscribe/bounce/complaint path goes through here. */
    async suppress(workspaceId, email, reason, source) {
        await this.suppressions.createQueryBuilder().insert()
            .values({ workspaceId, email: email.toLowerCase(), reason, source }).orIgnore().execute();
        const statusMap = { unsubscribe: 'unsubscribed', hard_bounce: 'bounced', complaint: 'complained', manual: 'suppressed' };
        await this.contacts.update({ workspaceId, email: email.toLowerCase() }, { status: statusMap[reason], subscribed: false });
        if (reason === 'unsubscribe') {
            await this.unsubs.save(this.unsubs.create({ workspaceId, email: email.toLowerCase(), reason: source }));
        }
    }
    async stats(workspaceId) {
        const rows = await this.dataSource.query(`SELECT status, COUNT(*) AS c FROM contacts WHERE workspace_id = ? GROUP BY status`, [workspaceId]);
        const by = Object.fromEntries(rows.map((r) => [r.status, +r.c]));
        const total = Object.values(by).reduce((a, b) => a + b, 0);
        return {
            total,
            active: by.active || 0,
            unsubscribed: by.unsubscribed || 0,
            bounced: by.bounced || 0,
            complained: by.complained || 0,
            suppressed: by.suppressed || 0,
        };
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ContactList)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ContactListMember)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Suppression)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Unsubscribe)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.CampaignEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        segments_service_1.SegmentsService,
        typeorm_2.DataSource,
        billing_service_1.BillingService])
], ContactsService);
