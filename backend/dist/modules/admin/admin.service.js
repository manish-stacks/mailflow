"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const entities_1 = require("../../database/entities");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const tokens_1 = require("../../common/tokens");
const permissions_1 = require("../../common/permissions");
const billing_service_1 = require("../billing/billing.service");
/**
 * Platform-operator view. Everything here is cross-tenant on purpose, which is
 * why it sits behind SuperAdminGuard and never behind WorkspaceGuard.
 */
let AdminService = class AdminService {
    workspaces;
    users;
    subs;
    payments;
    billing;
    db;
    jwt;
    config;
    constructor(workspaces, users, subs, payments, billing, db, jwt, config) {
        this.workspaces = workspaces;
        this.users = users;
        this.subs = subs;
        this.payments = payments;
        this.billing = billing;
        this.db = db;
        this.jwt = jwt;
        this.config = config;
    }
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
            mrr: byPlan.reduce((sum, p) => sum + Number(p.mrr || 0), 0),
            byPlan: byPlan.map((p) => ({ name: p.name, slug: p.slug, workspaces: +p.workspaces, mrr: Number(p.mrr || 0) })),
        };
    }
    async listWorkspaces(q) {
        const params = [];
        let where = 'w.deleted_at IS NULL';
        if (q.search) {
            where += ' AND (w.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${q.search}%`, `%${q.search}%`);
        }
        if (q.status) {
            where += ' AND w.status = ?';
            params.push(q.status);
        }
        if (q.plan) {
            where += ' AND p.slug = ?';
            params.push(q.plan);
        }
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
        const data = rows.map((r) => ({
            id: r.id, name: r.name, slug: r.slug, status: r.status, createdAt: r.created_at,
            ownerEmail: r.owner_email, ownerName: r.owner_first_name,
            plan: r.plan_name ? { name: r.plan_name, slug: r.plan_slug } : null,
            subscriptionStatus: r.subscription_status,
            currentPeriodEnd: r.current_period_end,
            contacts: +r.contacts, members: +r.members, emailsSent: +r.emails_sent,
        }));
        return (0, pagination_dto_1.paginate)(data, +total, q.page, q.limit);
    }
    async workspaceDetail(workspaceId) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        if (!ws)
            throw new common_1.NotFoundException('Workspace not found');
        const summary = await this.billing.summary(workspaceId);
        const members = await this.db.query(`
      SELECT m.id, m.role, m.status, u.email, u.first_name, u.last_name, u.last_login_at
      FROM workspace_members m LEFT JOIN users u ON u.id = m.user_id
      WHERE m.workspace_id = ?`, [workspaceId]);
        return { workspace: ws, ...summary, members };
    }
    /** Move a client onto a plan, with optional per-customer overrides. */
    assignPlan(workspaceId, plan, opts) {
        return this.billing.assignPlan(workspaceId, plan, opts);
    }
    async setWorkspaceStatus(workspaceId, status) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        if (!ws)
            throw new common_1.NotFoundException('Workspace not found');
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
        const staff = await this.db.query(`SELECT id, email, first_name, last_name, last_login_at, created_at, is_super_admin, admin_permissions
       FROM users WHERE is_super_admin = 0 AND admin_permissions IS NOT NULL AND JSON_LENGTH(admin_permissions) > 0`);
        const mapped = staff.map((u) => ({
            id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
            lastLoginAt: u.last_login_at, createdAt: u.created_at,
            isSuperAdmin: false, adminPermissions: typeof u.admin_permissions === 'string' ? JSON.parse(u.admin_permissions) : u.admin_permissions,
        }));
        return [...rows, ...mapped];
    }
    availablePermissions() {
        return permissions_1.ADMIN_PERMISSIONS;
    }
    /**
     * Grants access. `permissions` scopes a limited "staff" admin (support/billing style);
     * omit it (or pass `full: true`) to make the account a true super admin with everything.
     */
    async grantAdmin(email, opts = {}) {
        const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
        if (!user)
            throw new common_1.NotFoundException('No user with that email');
        if (opts.full || !opts.permissions?.length) {
            await this.users.update(user.id, { isSuperAdmin: true, adminPermissions: null });
            return { message: `${user.email} is now a full platform administrator` };
        }
        const clean = opts.permissions.filter((p) => permissions_1.ADMIN_PERMISSIONS.includes(p));
        await this.users.update(user.id, { isSuperAdmin: false, adminPermissions: clean });
        return { message: `${user.email} was granted staff access with ${clean.length} permission(s)` };
    }
    async updateAdminPermissions(userId, permissions) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.isSuperAdmin)
            throw new common_1.BadRequestException('Full admins already have every permission');
        const clean = permissions.filter((p) => permissions_1.ADMIN_PERMISSIONS.includes(p));
        await this.users.update(userId, { adminPermissions: clean });
        return { message: 'Permissions updated', permissions: clean };
    }
    async revokeAdmin(userId, actorId) {
        if (userId === actorId)
            throw new common_1.BadRequestException('You cannot revoke your own admin access');
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
    async impersonateWorkspace(workspaceId, actorId) {
        const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
        if (!ws)
            throw new common_1.NotFoundException('Workspace not found');
        const owner = await this.users.findOne({ where: { id: ws.ownerId } });
        if (!owner)
            throw new common_1.NotFoundException('This workspace has no owner account');
        const accessToken = await this.jwt.signAsync({ sub: owner.id, email: owner.email, imp: true, by: actorId }, { secret: this.config.get('jwt.accessSecret'), expiresIn: '30m' });
        return {
            accessToken,
            expiresInMinutes: 30,
            workspace: { id: ws.id, name: ws.name, slug: ws.slug },
            user: { id: owner.id, email: owner.email, firstName: owner.firstName, lastName: owner.lastName },
        };
    }
    /* ------------------------------------------------------------ payments */
    async listPayments(q) {
        const params = [];
        let where = '1=1';
        if (q.status) {
            where += ' AND p.status = ?';
            params.push(q.status);
        }
        if (q.workspaceId) {
            where += ' AND p.workspace_id = ?';
            params.push(q.workspaceId);
        }
        if (q.from) {
            where += ' AND p.created_at >= ?';
            params.push(q.from);
        }
        if (q.to) {
            where += ' AND p.created_at <= ?';
            params.push(/^\d{4}-\d{2}-\d{2}$/.test(q.to) ? `${q.to} 23:59:59` : q.to);
        }
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
        const data = rows.map((r) => ({
            id: r.id, invoiceNumber: r.invoice_number, orderId: r.order_id, paymentId: r.payment_id,
            amount: r.amount, currency: r.currency, billingCycle: r.billing_cycle, status: r.status,
            method: r.method, failureReason: r.failure_reason,
            notes: typeof r.notes === 'string' ? JSON.parse(r.notes) : r.notes,
            paidAt: r.paid_at, createdAt: r.created_at,
            workspace: { id: r.workspace_id, name: r.workspace_name },
            ownerEmail: r.owner_email,
        }));
        return (0, pagination_dto_1.paginate)(data, +total, q.page, q.limit);
    }
    /**
     * Provision a whole client account: user + workspace + subscription.
     * This is the "sell to an agency client" path — one call, credentials back.
     */
    async provisionClient(dto, actorId) {
        const email = dto.email.toLowerCase().trim();
        let user = await this.users.findOne({ where: { email } });
        let temporaryPassword = null;
        if (!user) {
            temporaryPassword = dto.password || `mf-${(0, tokens_1.randomToken)(6)}`;
            user = await this.users.save(this.users.create({
                email, firstName: dto.firstName, lastName: dto.lastName,
                passwordHash: await bcrypt.hash(temporaryPassword, 12),
                emailVerified: true, mustChangePassword: true, createdBy: actorId,
            }));
        }
        const slugBase = dto.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
        const slug = `${slugBase || 'workspace'}-${(0, tokens_1.randomToken)(3).toLowerCase()}`;
        const workspace = await this.workspaces.save(this.workspaces.create({
            name: dto.workspaceName, slug, ownerId: user.id, status: 'active',
        }));
        await this.db.query('INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())', [workspace.id, user.id, 'owner', 'active']);
        await this.billing.assignPlan(workspace.id, dto.plan || 'free', {
            billingCycle: dto.billingCycle, trialDays: dto.trialDays,
        });
        return {
            workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
            user: { id: user.id, email: user.email },
            temporaryPassword,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Subscription)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        billing_service_1.BillingService,
        typeorm_2.DataSource,
        jwt_1.JwtService,
        config_1.ConfigService])
], AdminService);
