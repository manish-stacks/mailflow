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
 * R2 (Cloudflare, S3-compatible) storage with a local-disk fallback so the app
 * runs before credentials exist. Metadata always lands in MySQL.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private r2: S3Client | null = null;
  private localDir = path.join(process.cwd(), '.storage');

  constructor(
    private config: ConfigService,
    @InjectRepository(UploadedFile) private files: Repository<UploadedFile>,
  ) {
    const r2 = this.config.get('r2');
    if (r2.accessKey && r2.secretKey && r2.bucket && r2.endpoint) {
      this.r2 = new S3Client({
        endpoint: r2.endpoint,
        region: r2.region,
        forcePathStyle: false,
        credentials: { accessKeyId: r2.accessKey, secretAccessKey: r2.secretKey },
      });
    } else {
      this.logger.warn('R2 not configured — falling back to local disk storage');
    }
  }

  async upload(params: {
    workspaceId: string; userId?: string; buffer: Buffer;
    fileName: string; mimeType: string; purpose?: string;
  }) {
    const r2cfg = this.config.get('r2');
    const key = `${params.workspaceId}/${params.purpose || 'image'}/${randomUUID()}-${params.fileName.replace(/[^\w.-]/g, '_')}`;

    let url: string;
    if (this.r2) {
      await this.r2.send(new PutObjectCommand({
        Bucket: r2cfg.bucket, Key: key, Body: params.buffer, ContentType: params.mimeType,
      }));
      url = r2cfg.publicUrl ? `${r2cfg.publicUrl}/${key}` : `${r2cfg.endpoint}/${r2cfg.bucket}/${key}`;
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
    if (this.r2) {
      const res = await this.r2.send(new GetObjectCommand({
        Bucket: this.config.get('r2.bucket'), Key: storageKey,
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