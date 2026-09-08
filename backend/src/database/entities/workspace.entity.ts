import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

@Entity('workspaces')
export class Workspace extends BaseEntity {
  @Column() name: string;
  @Index({ unique: true }) @Column() slug: string;
  @Column({ name: 'owner_id' }) ownerId: string;
  @Column({ default: 'Asia/Kolkata' }) timezone: string;
  @Column({ default: 'free' }) plan: string;
  @Column({ name: 'ai_daily_limit', default: 200 }) aiDailyLimit: number;
  @Column({ type: 'enum', enum: ['active', 'suspended'], default: 'active' }) status: 'active' | 'suspended';
  @Column({ name: 'billing_name', nullable: true }) billingName: string;
  @Column({ name: 'billing_email', nullable: true }) billingEmail: string;
  @Column({ name: 'billing_address', nullable: true }) billingAddress: string;
  @Column({ name: 'billing_gstin', nullable: true }) billingGstin: string;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date;
}

@Entity('workspace_members')
export class WorkspaceMember extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Index() @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user: User;
  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'workspace_id' }) workspace: Workspace;
  @Column({ type: 'enum', enum: ['owner', 'admin', 'editor', 'viewer'], default: 'viewer' }) role: WorkspaceRole;
  @Column({ name: 'invited_email', nullable: true }) invitedEmail: string;
  @Column({ name: 'invite_token', nullable: true }) inviteToken: string;
  @Column({ type: 'enum', enum: ['active', 'invited', 'disabled'], default: 'active' }) status: 'active' | 'invited' | 'disabled';
}
