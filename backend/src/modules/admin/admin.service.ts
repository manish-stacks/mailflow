import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Subscription, User, Workspace } from '@/database/entities';
import { paginate, PaginationDto } from '@/common/dto/pagination.dto';
import { randomToken } from '@/common/tokens';
import { BillingService } from '@/modules/billing/billing.service';

/**
 * Platform-operator view. Everything here is cross-tenant on purpose, which is
 * why it sits behind SuperAdminGuard and never behind WorkspaceGuard.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Workspace) private workspaces: Repository<Workspace>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Subscription) private subs: Repository<Subscription>,
    private billing: BillingService,
    private db: DataSource,
  ) {}

  async stats() {
    const [row] = await this.db.query(`
      SELECT
        (SELECT COUNT(*) FROM workspaces WHERE deleted_at IS NULL) AS workspaces,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM contacts) AS contacts,
        (SELECT COALESCE(SUM(sent_count),0) FROM campaigns) AS emails_sent,
        (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active','trialing')) AS active_subscriptions
    `);
    const byPlan = await this.db.query(`
      SELECT p.name, p.slug, COUNT(s.id) AS workspaces,
             SUM(CASE WHEN s.status IN ('active','trialing') THEN p.price_monthly ELSE 0 END) AS mrr
      FROM plans p LEFT JOIN subscriptions s ON s.plan_id = p.id
      GROUP BY p.id ORDER BY p.sort_order ASC
    `);
    return {
      workspaces: +row.workspaces,
      users: +row.users,
      contacts: +row.contacts,
      emailsSent: +row.emails_sent,
      activeSubscriptions: +row.active_subscriptions,
      mrr: byPlan.reduce((sum: number, p: any) => sum + Number(p.mrr || 0), 0),
      byPlan: byPlan.map((p: any) => ({ name: p.name, slug: p.slug, workspaces: +p.workspaces, mrr: Number(p.mrr || 0) })),
    };
  }

  async listWorkspaces(q: PaginationDto & { status?: string; plan?: string }) {
    const params: any[] = [];
    let where = 'w.deleted_at IS NULL';
    if (q.search) { where += ' AND (w.name LIKE ? OR u.email LIKE ?)'; params.push(`%${q.search}%`, `%${q.search}%`); }
    if (q.status) { where += ' AND w.status = ?'; params.push(q.status); }
    if (q.plan) { where += ' AND p.slug = ?'; params.push(q.plan); }

    const offset = (q.page - 1) * q.limit;
    const rows = await this.db.query(`
      SELECT w.id, w.name, w.slug, w.status, w.created_at,
             u.email AS owner_email, u.first_name AS owner_first_name,
             p.name AS plan_name, p.slug AS plan_slug,
             s.status AS subscription_status, s.current_period_end,
             (SELECT COUNT(*) FROM contacts c WHERE c.workspace_id = w.id) AS contacts,
             (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id) AS members,
             (SELECT COALESCE(SUM(cp.sent_count),0) FROM campaigns cp WHERE cp.workspace_id = w.id) AS emails_sent
      FROM workspaces w
      LEFT JOIN users u ON u.id = w.owner_id
      LEFT JOIN subscriptions s ON s.workspace_id = w.id
      LEFT JOIN plans p ON p.id = s.plan_id
      WHERE ${where}
      ORDER BY w.created_at DESC LIMIT ? OFFSET ?
    `, [...params, q.limit, offset]);

    const [{ total }] = await this.db.query(`
      SELECT COUNT(*) AS total FROM workspaces w
      LEFT JOIN users u ON u.id = w.owner_id
      LEFT JOIN subscriptions s ON s.workspace_id = w.id
      LEFT JOIN plans p ON p.id = s.plan_id
      WHERE ${where}
    `, params);

    const data = rows.map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, status: r.status, createdAt: r.created_at,
      ownerEmail: r.owner_email, ownerName: r.owner_first_name,
      plan: r.plan_name ? { name: r.plan_name, slug: r.plan_slug } : null,
      subscriptionStatus: r.subscription_status,
      currentPeriodEnd: r.current_period_end,
      contacts: +r.contacts, members: +r.members, emailsSent: +r.emails_sent,
    }));
    return paginate(data, +total, q.page, q.limit);
  }

  async workspaceDetail(workspaceId: string) {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException('Workspace not found');
    const summary = await this.billing.summary(workspaceId);
    const members = await this.db.query(`
      SELECT m.id, m.role, m.status, u.email, u.first_name, u.last_name, u.last_login_at
      FROM workspace_members m LEFT JOIN users u ON u.id = m.user_id
      WHERE m.workspace_id = ?`, [workspaceId]);
    return { workspace: ws, ...summary, members };
  }

  /** Move a client onto a plan, with optional per-customer overrides. */
  assignPlan(workspaceId: string, plan: string, opts: any) {
    return this.billing.assignPlan(workspaceId, plan, opts);
  }

  async setWorkspaceStatus(workspaceId: string, status: 'active' | 'suspended') {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException('Workspace not found');
    await this.workspaces.update(workspaceId, { status });
    await this.billing.setStatus(workspaceId, status === 'suspended' ? 'suspended' : 'active');
    return { message: `Workspace ${status === 'suspended' ? 'suspended' : 'reactivated'}` };
  }

  /* --------------------------------------------------------- operators */

  listAdmins() {
    return this.users.find({
      where: { isSuperAdmin: true },
      select: ['id', 'email', 'firstName', 'lastName', 'lastLoginAt', 'createdAt'],
    });
  }

  async grantAdmin(email: string) {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('No user with that email');
    await this.users.update(user.id, { isSuperAdmin: true });
    return { message: `${user.email} is now a platform administrator` };
  }

  async revokeAdmin(userId: string, actorId: string) {
    if (userId === actorId) throw new BadRequestException('You cannot revoke your own admin access');
    await this.users.update(userId, { isSuperAdmin: false });
    return { message: 'Platform admin access revoked' };
  }

  /**
   * Provision a whole client account: user + workspace + subscription.
   * This is the "sell to an agency client" path — one call, credentials back.
   */
  async provisionClient(dto: {
    workspaceName: string; email: string; firstName: string; lastName?: string;
    password?: string; plan?: string; billingCycle?: any; trialDays?: number;
  }, actorId: string) {
    const email = dto.email.toLowerCase().trim();
    let user = await this.users.findOne({ where: { email } });
    let temporaryPassword: string | null = null;

    if (!user) {
      temporaryPassword = dto.password || `mf-${randomToken(6)}`;
      user = await this.users.save(this.users.create({
        email, firstName: dto.firstName, lastName: dto.lastName,
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        emailVerified: true, mustChangePassword: true, createdBy: actorId,
      }));
    }

    const slugBase = dto.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const slug = `${slugBase || 'workspace'}-${randomToken(3).toLowerCase()}`;

    const workspace = await this.workspaces.save(this.workspaces.create({
      name: dto.workspaceName, slug, ownerId: user.id, status: 'active',
    }));

    await this.db.query(
      'INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())',
      [workspace.id, user.id, 'owner', 'active'],
    );

    await this.billing.assignPlan(workspace.id, dto.plan || 'free', {
      billingCycle: dto.billingCycle, trialDays: dto.trialDays,
    });

    return {
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      user: { id: user.id, email: user.email },
      temporaryPassword,
    };
  }
}
