import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import { Repository } from 'typeorm';
import { Contact, ContactListMember, ImportJob, Suppression, UploadedFile } from '@/database/entities';
import { StorageService } from '@/modules/storage/storage.service';
import { BillingService } from '@/modules/billing/billing.service';
import { isUnlimited } from '@/modules/billing/plan-limits';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CHUNK = 500;

@Injectable()
export class CsvImportProcessor {
  private readonly logger = new Logger(CsvImportProcessor.name);

  constructor(
    @InjectRepository(ImportJob) private jobs: Repository<ImportJob>,
    @InjectRepository(UploadedFile) private files: Repository<UploadedFile>,
    @InjectRepository(Contact) private contacts: Repository<Contact>,
    @InjectRepository(ContactListMember) private listMembers: Repository<ContactListMember>,
    @InjectRepository(Suppression) private suppressions: Repository<Suppression>,
    private storage: StorageService,
    private billing: BillingService,
  ) {}

  async run(importJobId: string, workspaceId: string) {
    const job = await this.jobs.findOne({ where: { id: importJobId, workspaceId } });
    if (!job) return;
    await this.jobs.update(job.id, { status: 'processing' });

    let capped = false;
    try {
      const file = await this.files.findOne({ where: { id: job.fileId, workspaceId } });
      if (!file) throw new Error('Uploaded file not found');
      const buffer = await this.storage.download(file.storageKey);

      const rows: string[][] = parse(buffer.toString('utf8'), {
        bom: true, skip_empty_lines: true, relax_column_count: true,
      });
      const headers = rows[0].map((h) => String(h).trim());
      const body = rows.slice(1);

      const suppressed = new Set(
        (await this.suppressions.find({ where: { workspaceId }, select: ['email'] })).map((s) => s.email));

      const stats = { total: body.length, valid: 0, invalid: 0, duplicate: 0, imported: 0, failed: 0 };
      const errors: any[] = [];
      const seen = new Set<string>();
      let buffered: Partial<Contact>[] = [];

      for (let i = 0; i < body.length; i++) {
        const record = this.mapRow(headers, body[i], job.mapping);
        const email = String(record.email || '').toLowerCase().trim();

        if (!EMAIL_RE.test(email)) {
          stats.invalid++;
          if (errors.length < 100) errors.push({ row: i + 2, email, error: 'Invalid email address' });
          continue;
        }
        if (seen.has(email)) { stats.duplicate++; continue; }
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
        if (await this.capReached(workspaceId, buffered.length)) capped = true;
        else stats.imported += await this.flush(buffered, job.listId, workspaceId);
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
    } catch (err: any) {
      this.logger.error(`Import ${importJobId} failed: ${err.message}`);
      await this.jobs.update(importJobId, { status: 'failed', errors: [{ error: err.message }] });
    }
  }

  /**
   * Enforced per chunk rather than once up front: a 200k-row file on a 5k plan
   * imports the rows that fit and reports the rest as skipped, instead of either
   * failing outright or blowing straight through the cap.
   */
  private async capReached(workspaceId: string, incoming: number) {
    const limits = await this.billing.limitsFor(workspaceId);
    if (isUnlimited(limits.maxContacts)) return false;
    const current = await this.contacts.count({ where: { workspaceId } });
    return current + incoming > limits.maxContacts;
  }

  /** Existing contacts are updated, not duplicated — email is unique per workspace. */
  private async flush(rows: Partial<Contact>[], listId: string | null, workspaceId: string) {
    await this.contacts.createQueryBuilder().insert().values(rows as any)
      .orUpdate(['first_name', 'last_name', 'phone', 'custom_attributes'], ['workspace_id', 'email'])
      .execute();

    if (listId) {
      const saved = await this.contacts.find({
        where: rows.map((r) => ({ workspaceId, email: r.email })) as any,
        select: ['id'],
      });
      if (saved.length) {
        await this.listMembers.createQueryBuilder().insert()
          .values(saved.map((c) => ({ listId, contactId: c.id }))).orIgnore().execute();
      }
    }
    return rows.length;
  }

  private mapRow(headers: string[], row: string[], mapping: Record<string, string>) {
    const out: any = { custom_attributes: {} };
    headers.forEach((header, idx) => {
      const target = mapping[header];
      const value = (row[idx] ?? '').toString().trim();
      if (!target || target === 'skip' || value === '') return;
      if (target.startsWith('custom_attributes.')) {
        out.custom_attributes[target.slice('custom_attributes.'.length)] = value;
      } else {
        out[target] = value;
      }
    });
    return out;
  }
}
