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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Segment = exports.ContactListMember = exports.ContactList = exports.Contact = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let Contact = class Contact extends base_entity_1.BaseEntity {
    workspaceId;
    email;
    firstName;
    lastName;
    phone;
    status;
    subscribed;
    customAttributes;
    source;
    lastEngagedAt;
};
exports.Contact = Contact;
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Contact.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Contact.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'unsubscribed', 'bounced', 'complained', 'suppressed'], default: 'active' }),
    __metadata("design:type", String)
], Contact.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Boolean)
], Contact.prototype, "subscribed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'custom_attributes', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Contact.prototype, "customAttributes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'manual' }),
    __metadata("design:type", String)
], Contact.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_engaged_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Contact.prototype, "lastEngagedAt", void 0);
exports.Contact = Contact = __decorate([
    (0, typeorm_1.Entity)('contacts'),
    (0, typeorm_1.Unique)('uq_contact_ws_email', ['workspaceId', 'email']),
    (0, typeorm_1.Index)('idx_ct_ws_status', ['workspaceId', 'status'])
], Contact);
let ContactList = class ContactList extends base_entity_1.BaseEntity {
    workspaceId;
    name;
    description;
    contactCount;
};
exports.ContactList = ContactList;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], ContactList.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContactList.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContactList.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_count', default: 0 }),
    __metadata("design:type", Number)
], ContactList.prototype, "contactCount", void 0);
exports.ContactList = ContactList = __decorate([
    (0, typeorm_1.Entity)('contact_lists')
], ContactList);
let ContactListMember = class ContactListMember {
    id;
    listId;
    contactId;
    createdAt;
};
exports.ContactListMember = ContactListMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContactListMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'list_id' }),
    __metadata("design:type", String)
], ContactListMember.prototype, "listId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'contact_id' }),
    __metadata("design:type", String)
], ContactListMember.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ContactListMember.prototype, "createdAt", void 0);
exports.ContactListMember = ContactListMember = __decorate([
    (0, typeorm_1.Entity)('contact_list_members'),
    (0, typeorm_1.Unique)('uq_list_contact', ['listId', 'contactId'])
], ContactListMember);
let Segment = class Segment extends base_entity_1.BaseEntity {
    workspaceId;
    name;
    description;
    matchType;
    rules;
    cachedCount;
    cachedAt;
};
exports.Segment = Segment;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Segment.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Segment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Segment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'match_type', type: 'enum', enum: ['all', 'any'], default: 'all' }),
    __metadata("design:type", String)
], Segment.prototype, "matchType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], Segment.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cached_count', nullable: true }),
    __metadata("design:type", Number)
], Segment.prototype, "cachedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cached_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Segment.prototype, "cachedAt", void 0);
exports.Segment = Segment = __decorate([
    (0, typeorm_1.Entity)('segments')
], Segment);
