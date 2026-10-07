import { Column, DeleteDateColumn, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('automations')
export class Automation extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() name: string;
  @Column({ name: 'trigger_type', type: 'enum', enum: ['list_join', 'contact_created'], default: 'list_join' })
  triggerType: 'list_join' | 'contact_created';
  @Column({ name: 'list_id', nullable: true }) listId: string;
  @Column({ name: 'sender_identity_id', nullable: true }) senderIdentityId: string;
  @Column({ type: 'enum', enum: ['draft', 'active', 'paused'], default: 'draft' }) status: 'draft' | 'active' | 'paused';
  @Column({ name: 'activated_at', type: 'datetime', nullable: true }) activatedAt: Date;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date;
}

@Entity('automation_steps')
export class AutomationStep extends BaseEntity {
  @Index() @Column({ name: 'automation_id' }) automationId: string;
  @Column({ default: 0 }) position: number;
  @Column({ name: 'delay_minutes', default: 0 }) delayMinutes: number;
  @Column() subject: string;
  @Column({ name: 'preview_text', nullable: true }) previewText: string;
  @Column({ name: 'html_content', type: 'mediumtext', nullable: true }) htmlContent: string;
}

@Entity('automation_enrollments')
@Unique('uq_ae_auto_contact', ['automationId', 'contactId'])
export class AutomationEnrollment extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column({ name: 'automation_id' }) automationId: string;
  @Column({ name: 'contact_id' }) contactId: string;
  @Column({ name: 'next_step', default: 0 }) nextStep: number;
  @Column({ name: 'next_run_at', type: 'datetime' }) nextRunAt: Date;
  @Column({ type: 'enum', enum: ['active', 'completed', 'cancelled'], default: 'active' }) status: 'active' | 'completed' | 'cancelled';
  @Column({ name: 'sent_count', default: 0 }) sentCount: number;
  @Column({ default: 0 }) attempts: number;
  @Column({ name: 'last_error', nullable: true }) lastError: string;
}
