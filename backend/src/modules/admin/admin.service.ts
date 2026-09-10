import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Payment, Subscription, User, Workspace } from '@/database/entities';
import { paginate, PaginationDto } from '@/common/dto/pagination.dto';
import { randomToken } from '@/common/tokens';
import { ADMIN_PERMISSIONS, AdminPermission } from '@/common/permissions';
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
    @InjectRepository(Payment) private payments: Repository<Payment>,
    private billing: BillingService,
    private db: DataSource,
    private jwt: JwtService,
    private config: ConfigService,
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

  /** Every user with any platform-staff access — full super admins and delegated staff alike. */
  async listAdmins() {
    const rows = await this.users.find({
      where: { isSuperAdmin: true },
      select: ['id', 'email', 'firstName', 'lastName', 'lastLoginAt', 'createdAt', 'isSuperAdmin', 'adminPermissions'],
    });
    const staff = await this.db.query(
      `SELECT id, email, first_name, last_name, last_login_at, created_at, is_super_admin, admin_permissions
       FROM users WHERE is_super_admin = 0 AND admin_permissions IS NOT NULL AND JSON_LENGTH(admin_permissions) > 0`,
    );
    const mapped = staff.map((u: any) => ({
      id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
      lastLoginAt: u.last_login_at, createdAt: u.created_at,
      isSuperAdmin: false, adminPermissions: typeof u.admin_permissions === 'string' ? JSON.parse(u.admin_permissions) : u.admin_permissions,
    }));
    return [...rows, ...mapped];
  }

  availablePermissions() {
    return ADMIN_PERMISSIONS;
  }

  /**
   * Grants access. `permissions` scopes a limited "staff" admin (support/billing style);
   * omit it (or pass `full: true`) to make the account a true super admin with everything.
   */
  async grantAdmin(email: string, opts: { full?: boolean; permissions?: AdminPermission[] } = {}) {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('No user with that email');
    if (opts.full || !opts.permissions?.length) {
      await this.users.update(user.id, { isSuperAdmin: true, adminPermissions: null });
      return { message: `${user.email} is now a full platform administrator` };
    }
    const clean = opts.permissions.filter((p) => (ADMIN_PERMISSIONS as readonly string[]).includes(p));
    await this.users.update(user.id, { isSuperAdmin: false, adminPermissions: clean });
    return { message: `${user.email} was granted staff access with ${clean.length} permission(s)` };
  }

  async updateAdminPermissions(userId: string, permissions: AdminPermission[]) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isSuperAdmin) throw new BadRequestException('Full admins already have every permission');
    const clean = permissions.filter((p) => (ADMIN_PERMISSIONS as readonly string[]).includes(p));
    await this.users.update(userId, { adminPermissions: clean });
    return { message: 'Permissions updated', permissions: clean };
  }

  async revokeAdmin(userId: string, actorId: string) {
    if (userId === actorId) throw new BadRequestException('You cannot revoke your own admin access');
    await this.users.update(userId, { isSuperAdmin: false, adminPermissions: null });
    return { message: 'Platform admin access revoked' };
  }

  /* ------------------------------------------------------- impersonation */

  /**
   * Issues a short-lived access token for the workspace owner, no refresh token
   * involved on purpose — the session simply expires. Meant to be opened in a
   * fresh browser tab (see the frontend `/impersonate` route) so the admin's own
   * session, kept in localStorage, is never touched.
   */
  async impersonateWorkspace(workspaceId: string, actorId: string) {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException('Workspace not found');
    const owner = await this.users.findOne({ where: { id: ws.ownerId } });
    if (!owner) throw new NotFoundException('This workspace has no owner account');

    const accessToken = await this.jwt.signAsync(
      { sub: owner.id, email: owner.email, imp: true, by: actorId },
      { secret: this.config.get('jwt.accessSecret'), expiresIn: '30m' },
    );
    return {
      accessToken,
      expiresInMinutes: 30,
      workspace: { id: ws.id, name: ws.name, slug: ws.slug },
      user: { id: owner.id, email: owner.email, firstName: owner.firstName, lastName: owner.lastName },
    };
  }

  /* ------------------------------------------------------------ payments */

  async listPayments(q: PaginationDto & { status?: string; workspaceId?: string; from?: string; to?: string }) {
    const params: any[] = [];
    let where = '1=1';
    if (q.status) { where += ' AND p.status = ?'; params.push(q.status); }
    if (q.workspaceId) { where += ' AND p.workspace_id = ?'; params.push(q.workspaceId); }
    if (q.from) { where += ' AND p.created_at >= ?'; params.push(q.from); }
    if (q.to) { where += ' AND p.created_at <= ?'; params.push(/^\d{4}-\d{2}-\d{2}$/.test(q.to) ? `${q.to} 23:59:59` : q.to); }
    if (q.search) {
      where += ' AND (w.name LIKE ? OR u.email LIKE ? OR p.invoice_number LIKE ? OR p.payment_id LIKE ?)';
      params.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
    }

    const offset = (q.page - 1) * q.limit;
    const rows = await this.db.query(`
      SELECT p.id, p.invoice_number, p.order_id, p.payment_id, p.amount, p.currency, p.billing_cycle,
             p.status, p.method, p.failure_reason, p.notes, p.paid_at, p.created_at,
             w.id AS workspace_id, w.name AS workspace_name, u.email AS owner_email
      FROM payments p
      LEFT JOIN workspaces w ON w.id = p.workspace_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE ${where}
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [...params, q.limit, offset]);

    const [{ total }] = await this.db.query(`
      SELECT COUNT(*) AS total FROM payments p
      LEFT JOIN workspaces w ON w.id = p.workspace_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE ${where}
    `, params);

    const data = rows.map((r: any) => ({
      id: r.id, invoiceNumber: r.invoice_number, orderId: r.order_id, paymentId: r.payment_id,
      amount: r.amount, currency: r.currency, billingCycle: r.billing_cycle, status: r.status,
      method: r.method, failureReason: r.failure_reason,
      notes: typeof r.notes === 'string' ? JSON.parse(r.notes) : r.notes,
      paidAt: r.paid_at, createdAt: r.created_at,
      workspace: { id: r.workspace_id, name: r.workspace_name },
      ownerEmail: r.owner_email,
    }));
    return paginate(data, +total, q.page, q.limit);
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
