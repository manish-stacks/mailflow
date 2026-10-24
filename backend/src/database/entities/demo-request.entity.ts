import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export const DEMO_STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'spam'] as const;
export type DemoStatus = (typeof DEMO_STATUSES)[number];

@Entity('demo_requests')
@Index('idx_demo_status_created', ['status', 'createdAt'])
export class DemoRequest extends BaseEntity {
  @Column({ length: 150 }) name: string;
  @Index('idx_demo_email') @Column() email: string;
  @Column({ type: 'varchar', length: 200, nullable: true }) company: string | null;
  @Column({ name: 'team_size', type: 'varchar', length: 30, nullable: true }) teamSize: string | null;
  @Column({ type: 'json', nullable: true }) interests: string[] | null;
  @Column({ type: 'text', nullable: true }) message: string | null;
  @Column({ length: 60, default: 'landing' }) source: string;
  @Column({ type: 'enum', enum: [...DEMO_STATUSES], default: 'new' }) status: DemoStatus;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'boolean', default: true }) consent: boolean;
  @Column({ type: 'varchar', length: 64, nullable: true }) ip: string | null;
  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true }) userAgent: string | null;
  @Column({ name: 'contacted_at', type: 'datetime', nullable: true }) contactedAt: Date | null;
  @Column({ name: 'handled_by', type: 'char', length: 36, nullable: true }) handledBy: string | null;
}
