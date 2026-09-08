import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

export type CampaignStatus = 'draft' | 'scheduled' | 'preparing' | 'sending' | 'completed' | 'paused' | 'cancelled' | 'failed';
export type RecipientStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'skipped';
export type EventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' | 'failed';

export interface CampaignSettings {
  trackOpens?: boolean;
  trackClicks?: boolean;
  includeUnsubscribeLink?: boolean;
  replyTo?: string;
}

export interface CampaignAudience {
  mode: 'all' | 'lists' | 'segments';
  listIds?: string[];
  segmentIds?: string[];
  excludeListIds?: string[];
}

@Entity('email_templates')
export class EmailTemplate extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() name: string;
  @Column({ default: 'general' }) category: string;
  @Column({ nullable: true }) subject: string;
  @Column({ name: 'preview_text', nullable: true }) previewText: string;
  @Column({ name: 'html_content', type: 'mediumtext', nullable: true }) htmlContent: string;
  @Column({ name: 'design_json', type: 'json', nullable: true }) designJson: any;
  @Column({ nullable: true }) thumbnail: string;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date;
}

@Entity('campaigns')
@Index('idx_cp_ws_status', ['workspaceId', 'status'])
export class Campaign extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() name: string;
  @Column({ nullable: true }) subject: string;
  @Column({ name: 'preview_text', nullable: true }) previewText: string;
  @Column({ name: 'html_content', type: 'mediumtext', nullable: true }) htmlContent: string;
  @Column({ name: 'design_json', type: 'json', nullable: true }) designJson: any;
  @Column({ name: 'template_id', nullable: true }) templateId: string;
  @Column({ name: 'sender_identity_id', nullable: true }) senderIdentityId: string;
  @Column({ type: 'json', nullable: true }) audience: CampaignAudience;
  @Column({ type: 'json', nullable: true }) settings: CampaignSettings;
  @Column({ type: 'enum', enum: ['draft', 'scheduled', 'preparing', 'sending', 'completed', 'paused', 'cancelled', 'failed'], default: 'draft' })
  status: CampaignStatus;
  @Index() @Column({ name: 'scheduled_at', type: 'datetime', nullable: true }) scheduledAt: Date;
  @Column({ name: 'started_at', type: 'datetime', nullable: true }) startedAt: Date;
  @Column({ name: 'completed_at', type: 'datetime', nullable: true }) completedAt: Date;
  @Column({ name: 'total_recipients', default: 0 }) totalRecipients: number;
  @Column({ name: 'sent_count', default: 0 }) sentCount: number;
  @Column({ name: 'delivered_count', default: 0 }) deliveredCount: number;
  @Column({ name: 'failed_count', default: 0 }) failedCount: number;
  @Column({ name: 'bounced_count', default: 0 }) bouncedCount: number;
  @Column({ name: 'complained_count', default: 0 }) complainedCount: number;
  @Column({ name: 'unsubscribed_count', default: 0 }) unsubscribedCount: number;
  @Column({ name: 'unique_opens', default: 0 }) uniqueOpens: number;
  @Column({ name: 'total_opens', default: 0 }) totalOpens: number;
  @Column({ name: 'unique_clicks', default: 0 }) uniqueClicks: number;
  @Column({ name: 'total_clicks', default: 0 }) totalClicks: number;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date;
}

@Entity('campaign_recipients')
@Unique('uq_cr_campaign_contact', ['campaignId', 'contactId'])
@Index('idx_cr_campaign_status', ['campaignId', 'status'])
export class CampaignRecipient extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'campaign_id' }) campaignId: string;
  @Index() @Column({ name: 'contact_id' }) contactId: string;
  @Index() @Column() email: string;
  @Column({ type: 'enum', enum: ['pending', 'queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped'], default: 'pending' })
  status: RecipientStatus;
  @Column({ name: 'error_message', nullable: true }) errorMessage: string;
  @Index() @Column({ name: 'message_id', nullable: true }) messageId: string;
  @Column({ name: 'open_count', default: 0 }) openCount: number;
  @Column({ name: 'click_count', default: 0 }) clickCount: number;
  @Column({ name: 'sent_at', type: 'datetime', nullable: true }) sentAt: Date;
  @Column({ name: 'delivered_at', type: 'datetime', nullable: true }) deliveredAt: Date;
  @Column({ name: 'opened_at', type: 'datetime', nullable: true }) openedAt: Date;
  @Column({ name: 'clicked_at', type: 'datetime', nullable: true }) clickedAt: Date;
  @Column({ name: 'bounced_at', type: 'datetime', nullable: true }) bouncedAt: Date;
  @Column({ name: 'unsubscribed_at', type: 'datetime', nullable: true }) unsubscribedAt: Date;
}

@Entity('campaign_events')
@Index('idx_ce_campaign_type', ['campaignId', 'eventType'])
export class CampaignEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'campaign_id' }) campaignId: string;
  @Index() @Column({ name: 'campaign_recipient_id', nullable: true }) campaignRecipientId: string;
  @Index() @Column({ name: 'contact_id', nullable: true }) contactId: string;
  @Column({ name: 'event_type', type: 'enum', enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed'] })
  eventType: EventType;
  @Column({ type: 'json', nullable: true }) metadata: Record<string, any>;
  @Index({ unique: true }) @Column({ name: 'dedupe_key', length: 191, nullable: true }) dedupeKey: string;
  @Index() @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('tracked_links')
@Unique('uq_tl_campaign_url', ['campaignId', 'urlHash'])
export class TrackedLink {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'campaign_id' }) campaignId: string;
  @Column({ length: 2048 }) url: string;
  @Column({ name: 'url_hash', length: 64 }) urlHash: string;
  @Column({ nullable: true }) label: string;
  @Column({ name: 'total_clicks', default: 0 }) totalClicks: number;
  @Column({ name: 'unique_clicks', default: 0 }) uniqueClicks: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
