import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination.dto';
import {
  CampaignEvent, Contact, ContactList, ContactListMember, Suppression, Unsubscribe,
} from '@/database/entities';
import { SegmentsService } from '@/modules/segments/segments.service';
import { BulkActionDto, CreateContactDto, QueryContactsDto, UpdateContactDto } from './dto';
import { BillingService } from '@/modules/billing/billing.service';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(ContactList) private lists: Repository<ContactList>,
    @InjectRepository(ContactListMember) private listMembers: Repository<ContactListMember>,
    @InjectRepository(Suppression) private suppressions: Repository<Suppression>,
    @InjectRepository(Unsubscribe) private unsubs: Repository<Unsubscribe>,
    @InjectRepository(CampaignEvent) private events: Repository<CampaignEvent>,
    private segments: SegmentsService,
    private dataSource: DataSource,
    private billing: BillingService,
  ) {}

  async findAll(workspaceId: string, q: QueryContactsDto) {
    const qb = this.contacts.createQueryBuilder('c').where('c.workspace_id = :workspaceId', { workspaceId });

    if (q.status) qb.andWhere('c.status = :status', { status: q.status });

    if (q.search) {
      const s = `%${q.search.trim()}%`;
      qb.andWhere(new Brackets((w) => {
        w.where('c.email LIKE :s', { s })
          .orWhere('c.first_name LIKE :s', { s })
          .orWhere('c.last_name LIKE :s', { s });
      }));
    }

    if (q.listId) {
      qb.innerJoin(ContactListMember, 'clm', 'clm.contact_id = c.id AND clm.list_id = :listId', { listId: q.listId });
    }

    if (q.segmentId) {
      const seg = await this.segments.findOne(workspaceId, q.segmentId);
      this.segments.applyRules(qb, seg, 'c');
    }

    const sortable = ['created_at', 'updated_at', 'email', 'status'];
    const sortBy = sortable.includes(q.sortBy) ? q.sortBy : 'created_at';
    qb.orderBy(`c.${sortBy}`, (q.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC')
      .skip((q.page - 1) * q.limit).take(q.limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, q.page, q.limit);
  }

  async findOne(workspaceId: string, id: string) {
    const contact = await this.contacts.findOne({ where: { id, workspaceId } });
    if (!contact) throw new NotFoundException('Contact not found');
    const lists = await this.dataSource.query(
      `SELECT l.id, l.name FROM contact_list_members m JOIN contact_lists l ON l.id = m.list_id WHERE m.contact_id = ?`,
      [id],
    );
    return { ...contact, lists };
  }

  async activity(workspaceId: string, id: string) {
    return this.events.find({
      where: { workspaceId, contactId: id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async create(workspaceId: string, dto: CreateContactDto) {
    await this.billing.assertQuota(workspaceId, 'contacts');
    const email = dto.email.toLowerCase().trim();
    const existing = await this.contacts.findOne({ where: { workspaceId, email } });
    if (existing) throw new BadRequestException('A contact with this email already exists');

    const suppressed = await this.suppressions.findOne({ where: { workspaceId, email } });
    const contact = await this.contacts.save(this.contacts.create({
      workspaceId, email,
      firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
      customAttributes: dto.customAttributes || {},
      status: suppressed ? 'suppressed' : 'active',
      subscribed: !suppressed,
    }));

    if (dto.listIds?.length) await this.addToLists([contact.id], dto.listIds);
    return contact;
  }

  async update(workspaceId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.contacts.findOne({ where: { id, workspaceId } });
    if (!contact) throw new NotFoundException('Contact not found');
    if (dto.status === 'unsubscribed' || dto.subscribed === false) {
      await this.suppress(workspaceId, contact.email, 'unsubscribe', 'manual');
    }
    await this.contacts.update(id, dto as any);
    return this.contacts.findOne({ where: { id } });
  }

  async remove(workspaceId: string, id: string) {
    const res = await this.contacts.delete({ id, workspaceId });
    if (!res.affected) throw new NotFoundException('Contact not found');
    return { message: 'Contact deleted' };
  }

  async bulk(workspaceId: string, dto: BulkActionDto) {
    const contacts = await this.contacts.find({ where: { workspaceId, id: In(dto.contactIds) } });
    const ids = contacts.map((c) => c.id);
    if (!ids.length) return { affected: 0 };

    switch (dto.action) {
      case 'delete':
        await this.contacts.delete({ id: In(ids) });
        break;
      case 'unsubscribe':
        await this.contacts.update({ id: In(ids) }, { status: 'unsubscribed', subscribed: false });
        for (const c of contacts) await this.suppress(workspaceId, c.email, 'unsubscribe', 'bulk');
        break;
      case 'add_to_list':
        if (!dto.listId) throw new BadRequestException('listId is required');
        await this.addToLists(ids, [dto.listId]);
        break;
      case 'remove_from_list':
        if (!dto.listId) throw new BadRequestException('listId is required');
        await this.listMembers.delete({ listId: dto.listId, contactId: In(ids) });
        await this.recountList(dto.listId);
        break;
    }
    return { affected: ids.length };
  }

  async addToLists(contactIds: string[], listIds: string[]) {
    const rows = listIds.flatMap((listId) => contactIds.map((contactId) => ({ listId, contactId })));
    if (!rows.length) return;
    await this.listMembers.createQueryBuilder().insert().values(rows).orIgnore().execute();
    for (const listId of listIds) await this.recountList(listId);
  }

  async recountList(listId: string) {
    const count = await this.listMembers.count({ where: { listId } });
    await this.lists.update(listId, { contactCount: count });
  }

  /** Central suppression writer — every unsubscribe/bounce/complaint path goes through here. */
  async suppress(workspaceId: string, email: string, reason: 'unsubscribe' | 'hard_bounce' | 'complaint' | 'manual', source: string) {
    await this.suppressions.createQueryBuilder().insert()
      .values({ workspaceId, email: email.toLowerCase(), reason, source }).orIgnore().execute();

    const statusMap = { unsubscribe: 'unsubscribed', hard_bounce: 'bounced', complaint: 'complained', manual: 'suppressed' } as const;
    await this.contacts.update({ workspaceId, email: email.toLowerCase() }, { status: statusMap[reason], subscribed: false });

    if (reason === 'unsubscribe') {
      await this.unsubs.save(this.unsubs.create({ workspaceId, email: email.toLowerCase(), reason: source }));
    }
  }

  async stats(workspaceId: string) {
    const rows = await this.dataSource.query(
      `SELECT status, COUNT(*) AS c FROM contacts WHERE workspace_id = ? GROUP BY status`, [workspaceId]);
    const by = Object.fromEntries(rows.map((r: any) => [r.status, +r.c]));
    const total = Object.values(by).reduce((a: number, b: any) => a + b, 0) as number;
    return {
      total,
      active: by.active || 0,
      unsubscribed: by.unsubscribed || 0,
      bounced: by.bounced || 0,
      complained: by.complained || 0,
      suppressed: by.suppressed || 0,
    };
  }
}
