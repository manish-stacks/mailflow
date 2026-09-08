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
exports.SendersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const tokens_1 = require("../../common/tokens");
const email_service_1 = require("../../integrations/email/email.service");
const billing_service_1 = require("../billing/billing.service");
let SendersService = class SendersService {
    senders;
    email;
    config;
    billing;
    constructor(senders, email, config, billing) {
        this.senders = senders;
        this.email = email;
        this.config = config;
        this.billing = billing;
    }
    findAll(workspaceId) {
        return this.senders.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
    }
    async findOne(workspaceId, id) {
        const s = await this.senders.findOne({ where: { id, workspaceId } });
        if (!s)
            throw new common_1.NotFoundException('Sender identity not found');
        return s;
    }
    async create(workspaceId, dto) {
        await this.billing.assertQuota(workspaceId, 'senders');
        const fromEmail = dto.fromEmail.toLowerCase();
        const exists = await this.senders.findOne({ where: { workspaceId, fromEmail } });
        if (exists)
            throw new common_1.BadRequestException('This sender email already exists');
        const token = (0, tokens_1.randomToken)(20);
        const sender = await this.senders.save(this.senders.create({
            workspaceId, fromName: dto.fromName, fromEmail,
            replyToEmail: dto.replyToEmail?.toLowerCase(),
            verificationToken: token, status: 'pending',
        }));
        await this.sendVerification(sender).catch(() => null);
        return sender;
    }
    async update(workspaceId, id, dto) {
        await this.findOne(workspaceId, id);
        await this.senders.update(id, dto);
        return this.findOne(workspaceId, id);
    }
    async remove(workspaceId, id) {
        await this.findOne(workspaceId, id);
        await this.senders.delete(id);
        return { message: 'Sender identity removed' };
    }
    async resend(workspaceId, id) {
        const sender = await this.findOne(workspaceId, id);
        if (sender.status === 'verified')
            throw new common_1.BadRequestException('Already verified');
        await this.sendVerification(sender);
        return { message: 'Verification email sent' };
    }
    async verify(token) {
        const sender = await this.senders.findOne({ where: { verificationToken: token } });
        if (!sender)
            throw new common_1.BadRequestException('Invalid verification link');
        await this.senders.update(sender.id, { status: 'verified', verifiedAt: new Date(), verificationToken: null });
        return { message: 'Sender verified', email: sender.fromEmail };
    }
    /** Campaign send gate. Dev installs can opt out via ALLOW_UNVERIFIED_SENDERS. */
    async assertSendable(workspaceId, senderId) {
        const sender = await this.findOne(workspaceId, senderId);
        if (sender.status !== 'verified' && !this.config.get('email.allowUnverifiedSenders')) {
            throw new common_1.BadRequestException(`Sender ${sender.fromEmail} is not verified`);
        }
        return sender;
    }
    async sendVerification(sender) {
        const url = `${this.config.get('trackingBaseUrl')}/senders/verify?token=${sender.verificationToken}`;
        await this.email.sendSystem(sender.fromEmail, 'Verify your sender address', `<p>Confirm <b>${sender.fromEmail}</b> as a MailFlow sender:</p><p><a href="${url}">${url}</a></p>`);
    }
};
exports.SendersService = SendersService;
exports.SendersService = SendersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.SenderIdentity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        email_service_1.EmailService,
        config_1.ConfigService,
        billing_service_1.BillingService])
], SendersService);
