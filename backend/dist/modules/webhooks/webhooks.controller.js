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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const queue_service_1 = require("../../queues/queue.service");
const queue_constants_1 = require("../../queues/queue.constants");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = class WebhooksController {
    svc;
    queue;
    constructor(svc, queue) {
        this.svc = svc;
        this.queue = queue;
    }
    /** Signature-checked, then handed to a queue so the provider gets a fast 200. */
    async receive(provider, headers, body, req) {
        const raw = req.rawBody ?? JSON.stringify(body);
        if (!this.svc.verify(provider, headers, raw))
            throw new common_1.BadRequestException('Invalid webhook signature');
        const events = this.svc.parse(body);
        await this.queue.addBulk(queue_constants_1.QUEUES.ANALYTICS_PROCESSING, events.map((e) => ({ name: 'webhook-event', data: { type: 'webhook', payload: e } })));
        return { received: events.length };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('email/:provider'),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "receive", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService, queue_service_1.QueueService])
], WebhooksController);
