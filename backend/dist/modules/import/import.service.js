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
exports.ImportService = exports.IMPORT_TARGETS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sync_1 = require("csv-parse/sync");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const queue_service_1 = require("../../queues/queue.service");
const queue_constants_1 = require("../../queues/queue.constants");
const storage_service_1 = require("../storage/storage.service");
const billing_service_1 = require("../billing/billing.service");
exports.IMPORT_TARGETS = [
    'email', 'first_name', 'last_name', 'phone', 'skip', 'custom',
];
let ImportService = class ImportService {
    jobs;
    storage;
    queue;
    billing;
    constructor(jobs, storage, queue, billing) {
        this.jobs = jobs;
        this.storage = storage;
        this.queue = queue;
        this.billing = billing;
    }
    /** Step 2/3 of the wizard: parse headers + first rows so the user can map columns. */
    async preview(buffer) {
        let rows;
        try {
            rows = (0, sync_1.parse)(buffer.toString('utf8'), { bom: true, skip_empty_lines: true, relax_column_count: true, to: 21 });
        }
        catch (e) {
            throw new common_1.BadRequestException(`Could not read CSV: ${e.message}`);
        }
        if (!rows.length)
            throw new common_1.BadRequestException('The file is empty');
        const headers = rows[0].map((h) => String(h).trim());
        const sample = rows.slice(1, 11);
        return { headers, sample, suggestedMapping: this.suggestMapping(headers) };
    }
    suggestMapping(headers) {
        const map = {};
        headers.forEach((h) => {
            const k = h.toLowerCase().replace(/[^a-z]/g, '');
            if (k.includes('email') || k === 'mail')
                map[h] = 'email';
            else if (k.includes('first'))
                map[h] = 'first_name';
            else if (k.includes('last') || k.includes('surname'))
                map[h] = 'last_name';
            else if (k.includes('phone') || k.includes('mobile'))
                map[h] = 'phone';
            else
                map[h] = `custom_attributes.${h.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
        });
        return map;
    }
    async start(workspaceId, userId, dto) {
        if (!Object.values(dto.mapping).includes('email')) {
            throw new common_1.BadRequestException('One column must be mapped to email');
        }
        // Rough pre-check: the worker re-checks per chunk, so a huge file cannot
        // sneak past the contact cap between queueing and processing.
        await this.billing.assertQuota(workspaceId, 'contacts');
        const job = await this.jobs.save(this.jobs.create({
            workspaceId, fileId: dto.fileId, listId: dto.listId || null,
            mapping: dto.mapping, status: 'pending', createdBy: userId,
        }));
        await this.queue.add(queue_constants_1.QUEUES.CSV_IMPORT, 'import', { importJobId: job.id, workspaceId });
        return job;
    }
    async findOne(workspaceId, id) {
        const job = await this.jobs.findOne({ where: { id, workspaceId } });
        if (!job)
            throw new common_1.NotFoundException('Import job not found');
        return job;
    }
    findAll(workspaceId) {
        return this.jobs.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: 25 });
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ImportJob)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        storage_service_1.StorageService,
        queue_service_1.QueueService,
        billing_service_1.BillingService])
], ImportService);
