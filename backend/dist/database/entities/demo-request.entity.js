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
exports.DemoRequest = exports.DEMO_STATUSES = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
exports.DEMO_STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'spam'];
let DemoRequest = class DemoRequest extends base_entity_1.BaseEntity {
    name;
    email;
    company;
    teamSize;
    interests;
    message;
    source;
    status;
    notes;
    consent;
    ip;
    userAgent;
    contactedAt;
    handledBy;
};
exports.DemoRequest = DemoRequest;
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], DemoRequest.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_demo_email'),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DemoRequest.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_size', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "teamSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], DemoRequest.prototype, "interests", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, default: 'landing' }),
    __metadata("design:type", String)
], DemoRequest.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: [...exports.DEMO_STATUSES], default: 'new' }),
    __metadata("design:type", String)
], DemoRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], DemoRequest.prototype, "consent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contacted_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], DemoRequest.prototype, "contactedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'handled_by', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", String)
], DemoRequest.prototype, "handledBy", void 0);
exports.DemoRequest = DemoRequest = __decorate([
    (0, typeorm_1.Entity)('demo_requests'),
    (0, typeorm_1.Index)('idx_demo_status_created', ['status', 'createdAt'])
], DemoRequest);
