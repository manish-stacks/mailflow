import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContactList, ContactListMember } from '@/database/entities';
import { ContactsService } from '@/modules/contacts/contacts.service';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(ContactList) private lists: Repository<ContactList>,
    @InjectRepository(ContactListMember) private members: Repository<ContactListMember>,
    private contacts: ContactsService,
  ) {}

  findAll(workspaceId: string) {
    return this.lists.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
  }

  async findOne(workspaceId: string, id: string) {
    const list = await this.lists.findOne({ where: { id, workspaceId } });
    if (!list) throw new NotFoundException('List not found');
    return list;
  }

  create(workspaceId: string, dto: { name: string; description?: string }) {
    return this.lists.save(this.lists.create({ ...dto, workspaceId }));
  }

  async update(workspaceId: string, id: string, dto: { name?: string; description?: string }) {
    await this.findOne(workspaceId, id);
    await this.lists.update(id, dto);
    return this.findOne(workspaceId, id);
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.lists.delete(id);
    return { message: 'List deleted' };
  }

  async addContacts(workspaceId: string, id: string, contactIds: string[]) {
    await this.findOne(workspaceId, id);
    await this.contacts.addToLists(contactIds, [id]);
    return { message: 'Contacts added', added: contactIds.length };
  }

  async removeContacts(workspaceId: string, id: string, contactIds: string[]) {
    await this.findOne(workspaceId, id);
    await this.members.delete({ listId: id, contactId: In(contactIds) });
    await this.contacts.recountList(id);
    return { message: 'Contacts removed' };
  }
}
