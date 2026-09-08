import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('unsubscribes')
export class Unsubscribe {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'contact_id', nullable: true }) contactId: string;
  @Column({ name: 'campaign_id', nullable: true }) campaignId: string;
  @Column() email: string;
  @Column({ nullable: true }) reason: string;
  @Column({ nullable: true }) ip: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('suppressions')
@Unique('uq_sup_ws_email', ['workspaceId', 'email'])
export class Suppression {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() email: string;
  @Column({ type: 'enum', enum: ['unsubscribe', 'hard_bounce', 'complaint', 'manual'] })
  reason: 'unsubscribe' | 'hard_bounce' | 'complaint' | 'manual';
  @Column({ nullable: true }) source: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('uploaded_files')
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'uploaded_by', nullable: true }) uploadedBy: string;
  @Column({ name: 'file_name' }) fileName: string;
  @Column({ name: 'storage_key', length: 500 }) storageKey: string;
  @Column({ length: 1000, nullable: true }) url: string;
  @Column({ name: 'mime_type', nullable: true }) mimeType: string;
  @Column({ name: 'size_bytes', type: 'bigint', default: 0 }) sizeBytes: number;
  @Column({ default: 'image' }) purpose: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('import_jobs')
export class ImportJob extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'file_id', nullable: true }) fileId: string;
  @Column({ name: 'list_id', nullable: true }) listId: string;
  @Column({ type: 'json' }) mapping: Record<string, string>;
  @Column({ type: 'enum', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';
  @Column({ name: 'total_rows', default: 0 }) totalRows: number;
  @Column({ name: 'valid_rows', default: 0 }) validRows: number;
  @Column({ name: 'invalid_rows', default: 0 }) invalidRows: number;
  @Column({ name: 'duplicate_rows', default: 0 }) duplicateRows: number;
  @Column({ name: 'imported_rows', default: 0 }) importedRows: number;
  @Column({ name: 'failed_rows', default: 0 }) failedRows: number;
  @Column({ type: 'json', nullable: true }) errors: any[];
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() name: string;
  @Index() @Column({ name: 'key_prefix', length: 16 }) keyPrefix: string;
  @Column({ name: 'key_hash' }) keyHash: string;
  @Column({ type: 'json', nullable: true }) scopes: string[];
  @Column({ name: 'last_used_at', type: 'datetime', nullable: true }) lastUsedAt: Date;
  @Column({ name: 'revoked_at', type: 'datetime', nullable: true }) revokedAt: Date;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id', nullable: true }) workspaceId: string;
  @Column({ name: 'user_id', nullable: true }) userId: string;
  @Column() action: string;
  @Column({ name: 'entity_type', nullable: true }) entityType: string;
  @Column({ name: 'entity_id', nullable: true }) entityId: string;
  @Column({ type: 'json', nullable: true }) metadata: Record<string, any>;
  @Column({ nullable: true }) ip: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('ai_usage')
export class AiUsage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'user_id', nullable: true }) userId: string;
  @Column() feature: string;
  @Column({ name: 'tokens_in', default: 0 }) tokensIn: number;
  @Column({ name: 'tokens_out', default: 0 }) tokensOut: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
