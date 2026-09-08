import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import { Repository } from 'typeorm';
import { ImportJob } from '@/database/entities';
import { QueueService } from '@/queues/queue.service';
import { QUEUES } from '@/queues/queue.constants';
import { StorageService } from '@/modules/storage/storage.service';
import { BillingService } from '@/modules/billing/billing.service';

export const IMPORT_TARGETS = [
  'email', 'first_name', 'last_name', 'phone', 'skip', 'custom',
] as const;

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportJob) private jobs: Repository<ImportJob>,
    private storage: StorageService,
    private queue: QueueService,
    private billing: BillingService,
  ) {}

  /** Step 2/3 of the wizard: parse headers + first rows so the user can map columns. */
  async preview(buffer: Buffer) {
    let rows: string[][];
    try {
      rows = parse(buffer.toString('utf8'), { bom: true, skip_empty_lines: true, relax_column_count: true, to: 21 });
    } catch (e: any) {
      throw new BadRequestException(`Could not read CSV: ${e.message}`);
    }
    if (!rows.length) throw new BadRequestException('The file is empty');

    const headers = rows[0].map((h) => String(h).trim());
    const sample = rows.slice(1, 11);
    return { headers, sample, suggestedMapping: this.suggestMapping(headers) };
  }

  private suggestMapping(headers: string[]) {
    const map: Record<string, string> = {};
    headers.forEach((h) => {
      const k = h.toLowerCase().replace(/[^a-z]/g, '');
      if (k.includes('email') || k === 'mail') map[h] = 'email';
      else if (k.includes('first')) map[h] = 'first_name';
      else if (k.includes('last') || k.includes('surname')) map[h] = 'last_name';
      else if (k.includes('phone') || k.includes('mobile')) map[h] = 'phone';
      else map[h] = `custom_attributes.${h.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
    });
    return map;
  }

  async start(workspaceId: string, userId: string, dto: { fileId: string; listId?: string; mapping: Record<string, string> }) {
    if (!Object.values(dto.mapping).includes('email')) {
      throw new BadRequestException('One column must be mapped to email');
    }
    // Rough pre-check: the worker re-checks per chunk, so a huge file cannot
    // sneak past the contact cap between queueing and processing.
    await this.billing.assertQuota(workspaceId, 'contacts');
    const job = await this.jobs.save(this.jobs.create({
      workspaceId, fileId: dto.fileId, listId: dto.listId || null,
      mapping: dto.mapping, status: 'pending', createdBy: userId,
    }));
    await this.queue.add(QUEUES.CSV_IMPORT, 'import', { importJobId: job.id, workspaceId });
    return job;
  }

  async findOne(workspaceId: string, id: string) {
    const job = await this.jobs.findOne({ where: { id, workspaceId } });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  findAll(workspaceId: string) {
    return this.jobs.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: 25 });
  }
}
