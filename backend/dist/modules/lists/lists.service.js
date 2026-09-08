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
exports.ListsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const contacts_service_1 = require("../contacts/contacts.service");
let ListsService = class ListsService {
    lists;
    members;
    contacts;
    constructor(lists, members, contacts) {
        this.lists = lists;
        this.members = members;
        this.contacts = contacts;
    }
    findAll(workspaceId) {
        return this.lists.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
    }
    async findOne(workspaceId, id) {
        const list = await this.lists.findOne({ where: { id, workspaceId } });
        if (!list)
            throw new common_1.NotFoundException('List not found');
        return list;
    }
    create(workspaceId, dto) {
        return this.lists.save(this.lists.create({ ...dto, workspaceId }));
    }
    async update(workspaceId, id, dto) {
        await this.findOne(workspaceId, id);
        await this.lists.update(id, dto);
        return this.findOne(workspaceId, id);
    }
    async remove(workspaceId, id) {
        await this.findOne(workspaceId, id);
        await this.lists.delete(id);
        return { message: 'List deleted' };
    }
    async addContacts(workspaceId, id, contactIds) {
        await this.findOne(workspaceId, id);
        await this.contacts.addToLists(contactIds, [id]);
        return { message: 'Contacts added', added: contactIds.length };
    }
    async removeContacts(workspaceId, id, contactIds) {
        await this.findOne(workspaceId, id);
        await this.members.delete({ listId: id, contactId: (0, typeorm_2.In)(contactIds) });
        await this.contacts.recountList(id);
        return { message: 'Contacts removed' };
    }
};
exports.ListsService = ListsService;
exports.ListsService = ListsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ContactList)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ContactListMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        contacts_service_1.ContactsService])
], ListsService);
