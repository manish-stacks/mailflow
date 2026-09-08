import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { UploadedFile } from '@/database/entities';

/**
 * S3-compatible storage with a local-disk fallback so the app runs before
 * credentials exist. Metadata always lands in MySQL.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private localDir = path.join(process.cwd(), '.storage');

  constructor(
    private config: ConfigService,
    @InjectRepository(UploadedFile) private files: Repository<UploadedFile>,
  ) {
    const s3 = this.config.get('s3');
    if (s3.accessKey && s3.secretKey && s3.bucket) {
      this.s3 = new S3Client({
        endpoint: s3.endpoint || undefined,
        region: s3.region,
        forcePathStyle: !!s3.endpoint,
        credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
      });
    } else {
      this.logger.warn('S3 not configured — falling back to local disk storage');
    }
  }

  async upload(params: {
    workspaceId: string; userId?: string; buffer: Buffer;
    fileName: string; mimeType: string; purpose?: string;
  }) {
    const s3cfg = this.config.get('s3');
    const key = `${params.workspaceId}/${params.purpose || 'image'}/${randomUUID()}-${params.fileName.replace(/[^\w.-]/g, '_')}`;

    let url: string;
    if (this.s3) {
      await this.s3.send(new PutObjectCommand({
        Bucket: s3cfg.bucket, Key: key, Body: params.buffer, ContentType: params.mimeType,
      }));
      url = s3cfg.publicUrl ? `${s3cfg.publicUrl}/${key}` : `${s3cfg.endpoint}/${s3cfg.bucket}/${key}`;
    } else {
      const dest = path.join(this.localDir, key);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, params.buffer);
      url = `${this.config.get('trackingBaseUrl')}/storage/${key}`;
    }

    return this.files.save(this.files.create({
      workspaceId: params.workspaceId,
      uploadedBy: params.userId,
      fileName: params.fileName,
      storageKey: key,
      url,
      mimeType: params.mimeType,
      sizeBytes: params.buffer.length,
      purpose: params.purpose || 'image',
    }));
  }

  async download(storageKey: string): Promise<Buffer> {
    if (this.s3) {
      const res = await this.s3.send(new GetObjectCommand({
        Bucket: this.config.get('s3.bucket'), Key: storageKey,
      }));
      const chunks: Buffer[] = [];
      for await (const chunk of res.Body as any) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks);
    }
    return fs.readFile(path.join(this.localDir, storageKey));
  }

  list(workspaceId: string, purpose?: string) {
    return this.files.find({
      where: { workspaceId, ...(purpose ? { purpose } : {}) },
      order: { createdAt: 'DESC' }, take: 100,
    });
  }
}
