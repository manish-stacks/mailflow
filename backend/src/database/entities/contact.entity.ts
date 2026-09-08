import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained' | 'suppressed';

@Entity('contacts')
@Unique('uq_contact_ws_email', ['workspaceId', 'email'])
@Index('idx_ct_ws_status', ['workspaceId', 'status'])
export class Contact extends BaseEntity {
  @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() email: string;
  @Column({ name: 'first_name', nullable: true }) firstName: string;
  @Column({ name: 'last_name', nullable: true }) lastName: string;
  @Column({ nullable: true }) phone: string;
  @Column({ type: 'enum', enum: ['active', 'unsubscribed', 'bounced', 'complained', 'suppressed'], default: 'active' }) status: ContactStatus;
  @Column({ type: 'tinyint', default: 1 }) subscribed: boolean;
  @Column({ name: 'custom_attributes', type: 'json', nullable: true }) customAttributes: Record<string, any>;
  @Column({ default: 'manual' }) source: string;
  @Column({ name: 'last_engaged_at', type: 'datetime', nullable: true }) lastEngagedAt: Date;
}

@Entity('contact_lists')
export class ContactList extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() name: string;
  @Column({ nullable: true }) description: string;
  @Column({ name: 'contact_count', default: 0 }) contactCount: number;
}

@Entity('contact_list_members')
@Unique('uq_list_contact', ['listId', 'contactId'])
export class ContactListMember {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'list_id' }) listId: string;
  @Index() @Column({ name: 'contact_id' }) contactId: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}

@Entity('segments')
export class Segment extends BaseEntity {
  @Index() @Column({ name: 'workspace_id' }) workspaceId: string;
  @Column() name: string;
  @Column({ nullable: true }) description: string;
  @Column({ name: 'match_type', type: 'enum', enum: ['all', 'any'], default: 'all' }) matchType: 'all' | 'any';
  @Column({ type: 'json' }) rules: any[];
  @Column({ name: 'cached_count', nullable: true }) cachedCount: number;
  @Column({ name: 'cached_at', type: 'datetime', nullable: true }) cachedAt: Date;
}
