import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('sender_identities')
@Unique('uq_sender_ws_email', ['workspaceId', 'fromEmail'])
export class SenderIdentity extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'from_name' }) fromName: string;
  @Column({ name: 'from_email' }) fromEmail: string;
  @Column({ name: 'reply_to_email', nullable: true }) replyToEmail: string;
  @Column({ type: 'enum', enum: ['pending', 'verified', 'failed'], default: 'pending' }) status: 'pending' | 'verified' | 'failed';
  @Column({ name: 'verification_token', nullable: true }) verificationToken: string;
  @Column({ name: 'verified_at', type: 'datetime', nullable: true }) verifiedAt: Date;
  @Column({ name: 'is_default', type: 'tinyint', default: 0 }) isDefault: boolean;
}

@Entity('sender_domains')
@Unique('uq_domain_ws', ['workspaceId', 'domain'])
export class SenderDomain extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() domain: string;
  @Column({ default: 'smtp' }) provider: string;
  @Column({ name: 'verification_status', type: 'enum', enum: ['pending', 'verifying', 'verified', 'failed'], default: 'pending' })
  verificationStatus: 'pending' | 'verifying' | 'verified' | 'failed';
  @Column({ name: 'verification_records', type: 'json', nullable: true }) verificationRecords: any[];
  @Column({ name: 'last_checked_at', type: 'datetime', nullable: true }) lastCheckedAt: Date;
  @Column({ name: 'verified_at', type: 'datetime', nullable: true }) verifiedAt: Date;
  @Column({ name: 'dkim_selector', default: 'mailflow' }) dkimSelector: string;
  @Column({ name: 'dkim_private_key_enc', type: 'text', nullable: true }) dkimPrivateKeyEnc: string;
}
