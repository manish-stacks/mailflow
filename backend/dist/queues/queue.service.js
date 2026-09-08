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
exports.QUEUES = exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
Object.defineProperty(exports, "QUEUES", { enumerable: true, get: function () { return queue_constants_1.QUEUES; } });
let QueueService = class QueueService {
    config;
    queues = new Map();
    constructor(config) {
        this.config = config;
    }
    get connection() {
        const r = this.config.get('redis');
        return { host: r.host, port: r.port, password: r.password, maxRetriesPerRequest: null };
    }
    queue(name) {
        if (!this.queues.has(name)) {
            this.queues.set(name, new bullmq_1.Queue(name, {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: 5,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: { age: 3600, count: 5000 },
                    removeOnFail: { age: 86400 },
                },
            }));
        }
        return this.queues.get(name);
    }
    add(name, jobName, data, opts) {
        return this.queue(name).add(jobName, data, opts);
    }
    addBulk(name, jobs) {
        return this.queue(name).addBulk(jobs);
    }
    async stats(name) {
        const q = this.queue(name);
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            q.getWaitingCount(), q.getActiveCount(), q.getCompletedCount(), q.getFailedCount(), q.getDelayedCount(),
        ]);
        return { name, waiting, active, completed, failed, delayed };
    }
    async onModuleDestroy() {
        await Promise.all([...this.queues.values()].map((q) => q.close()));
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QueueService);
