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
var CsvImportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvImportProcessor = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sync_1 = require("csv-parse/sync");
const typeorm_2 = require("typeorm");
const entities_1 = require("../database/entities");
const storage_service_1 = require("../modules/storage/storage.service");
const billing_service_1 = require("../modules/billing/billing.service");
const plan_limits_1 = require("../modules/billing/plan-limits");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CHUNK = 500;
let CsvImportProcessor = CsvImportProcessor_1 = class CsvImportProcessor {
    jobs;
    files;
    contacts;
    listMembers;
    suppressions;
    storage;
    billing;
    logger = new common_1.Logger(CsvImportProcessor_1.name);
    constructor(jobs, files, contacts, listMembers, suppressions, storage, billing) {
        this.jobs = jobs;
        this.files = files;
        this.contacts = contacts;
        this.listMembers = listMembers;
        this.suppressions = suppressions;
        this.storage = storage;
        this.billing = billing;
    }
    async run(importJobId, workspaceId) {
        const job = await this.jobs.findOne({ where: { id: importJobId, workspaceId } });
        if (!job)
            return;
        await this.jobs.update(job.id, { status: 'processing' });
        let capped = false;
        try {
            const file = await this.files.findOne({ where: { id: job.fileId, workspaceId } });
            if (!file)
                throw new Error('Uploaded file not found');
            const buffer = await this.storage.download(file.storageKey);
            const rows = (0, sync_1.parse)(buffer.toString('utf8'), {
                bom: true, skip_empty_lines: true, relax_column_count: true,
            });
            const headers = rows[0].map((h) => String(h).trim());
            const body = rows.slice(1);
            const suppressed = new Set((await this.suppressions.find({ where: { workspaceId }, select: ['email'] })).map((s) => s.email));
            const stats = { total: body.length, valid: 0, invalid: 0, duplicate: 0, imported: 0, failed: 0 };
            const errors = [];
            const seen = new Set();
            let buffered = [];
            for (let i = 0; i < body.length; i++) {
                const record = this.mapRow(headers, body[i], job.mapping);
                const email = String(record.email || '').toLowerCase().trim();
                if (!EMAIL_RE.test(email)) {
                    stats.invalid++;
                    if (errors.length < 100)
                        errors.push({ row: i + 2, email, error: 'Invalid email address' });
                    continue;
                }
                if (seen.has(email)) {
                    stats.duplicate++;
                    continue;
                }
                seen.add(email);
                stats.valid++;
                buffered.push({
                    workspaceId, email,
                    firstName: record.first_name || null,
                    lastName: record.last_name || null,
                    phone: record.phone || null,
                    customAttributes: record.custom_attributes,
                    source: 'import',
                    status: suppressed.has(email) ? 'suppressed' : 'active',
                    subscribed: !suppressed.has(email),
                });
                if (buffered.length >= CHUNK) {
                    if (await this.capReached(workspaceId, buffered.length)) {
                        capped = true;
                        break;
                    }
                    stats.imported += await this.flush(buffered, job.listId, workspaceId);
                    buffered = [];
                    await this.jobs.update(job.id, {
                        totalRows: stats.total, validRows: stats.valid, invalidRows: stats.invalid,
                        duplicateRows: stats.duplicate, importedRows: stats.imported,
                    });
                }
            }
            if (buffered.length && !capped) {
                if (await this.capReached(workspaceId, buffered.length))
                    capped = true;
                else
                    stats.imported += await this.flush(buffered, job.listId, workspaceId);
            }
            if (capped) {
                errors.push({ row: stats.total, error: 'Plan contact limit reached — remaining rows were skipped' });
            }
            await this.jobs.update(job.id, {
                status: 'completed',
                totalRows: stats.total, validRows: stats.valid, invalidRows: stats.invalid,
                duplicateRows: stats.duplicate, importedRows: stats.imported, failedRows: stats.failed,
                errors,
            });
            this.logger.log(`Import ${job.id} finished: ${stats.imported}/${stats.total} rows`);
        }
        catch (err) {
            this.logger.error(`Import ${importJobId} failed: ${err.message}`);
            await this.jobs.update(importJobId, { status: 'failed', errors: [{ error: err.message }] });
        }
    }
    /**
     * Enforced per chunk rather than once up front: a 200k-row file on a 5k plan
     * imports the rows that fit and reports the rest as skipped, instead of either
     * failing outright or blowing straight through the cap.
     */
    async capReached(workspaceId, incoming) {
        const limits = await this.billing.limitsFor(workspaceId);
        if ((0, plan_limits_1.isUnlimited)(limits.maxContacts))
            return false;
        const current = await this.contacts.count({ where: { workspaceId } });
        return current + incoming > limits.maxContacts;
    }
    /** Existing contacts are updated, not duplicated — email is unique per workspace. */
    async flush(rows, listId, workspaceId) {
        await this.contacts.createQueryBuilder().insert().values(rows)
            .orUpdate(['first_name', 'last_name', 'phone', 'custom_attributes'], ['workspace_id', 'email'])
            .execute();
        if (listId) {
            const saved = await this.contacts.find({
                where: rows.map((r) => ({ workspaceId, email: r.email })),
                select: ['id'],
            });
            if (saved.length) {
                await this.listMembers.createQueryBuilder().insert()
                    .values(saved.map((c) => ({ listId, contactId: c.id }))).orIgnore().execute();
            }
        }
        return rows.length;
    }
    mapRow(headers, row, mapping) {
        const out = { custom_attributes: {} };
        headers.forEach((header, idx) => {
            const target = mapping[header];
            const value = (row[idx] ?? '').toString().trim();
            if (!target || target === 'skip' || value === '')
                return;
            if (target.startsWith('custom_attributes.')) {
                out.custom_attributes[target.slice('custom_attributes.'.length)] = value;
            }
            else {
                out[target] = value;
            }
        });
        return out;
    }
};
exports.CsvImportProcessor = CsvImportProcessor;
exports.CsvImportProcessor = CsvImportProcessor = CsvImportProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ImportJob)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.UploadedFile)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Contact)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.ContactListMember)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Suppression)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        storage_service_1.StorageService,
        billing_service_1.BillingService])
], CsvImportProcessor);
