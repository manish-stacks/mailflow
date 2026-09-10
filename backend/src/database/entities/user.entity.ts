import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column() email: string;

  @Column({ name: 'password_hash', select: false }) passwordHash: string;
  @Column({ name: 'first_name', nullable: true }) firstName: string;
  @Column({ name: 'last_name', nullable: true }) lastName: string;
  @Column({ name: 'email_verified', type: 'tinyint', default: 0 }) emailVerified: boolean;
  @Column({ name: 'verification_token', nullable: true, select: false }) verificationToken: string;
  @Column({ name: 'reset_token', nullable: true, select: false }) resetToken: string;
  @Column({ name: 'reset_token_expires_at', type: 'datetime', nullable: true, select: false }) resetTokenExpiresAt: Date;
  @Column({ name: 'last_login_at', type: 'datetime', nullable: true }) lastLoginAt: Date;
  /** Platform operator (the agency running MailFlow), not a workspace role. */
  @Column({ name: 'is_super_admin', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  isSuperAdmin: boolean;
  /**
   * Granular platform-staff permissions (e.g. 'workspaces.manage', 'payments.view').
   * Ignored for a true super admin — they always have full access regardless of this list.
   */
  @Column({ name: 'admin_permissions', type: 'json', nullable: true })
  adminPermissions: string[] | null;
  /** Set when an admin creates the login; the user is nudged to reset on first sign-in. */
  @Column({ name: 'must_change_password', type: 'tinyint', default: 0, transformer: { to: (v) => (v ? 1 : 0), from: (v) => !!v } })
  mustChangePassword: boolean;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
}

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user: User;
  @Index() @Column({ name: 'token_hash' }) tokenHash: string;
  @Column({ name: 'expires_at', type: 'datetime' }) expiresAt: Date;
  @Column({ name: 'revoked_at', type: 'datetime', nullable: true }) revokedAt: Date;
  @Column({ name: 'user_agent', nullable: true }) userAgent: string;
  @Column({ nullable: true }) ip: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
