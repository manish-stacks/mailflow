import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLog, RefreshToken, User, Workspace, WorkspaceMember } from '@/database/entities';
import { randomToken } from '@/common/tokens';
import { EmailService } from '@/integrations/email/email.service';
import { CreateWorkspaceDto, CreateMemberLoginDto, InviteMemberDto, UpdateMemberDto, UpdateWorkspaceDto } from './dto';
import { BillingService } from '@/modules/billing/billing.service';
import * as bcrypt from 'bcrypt';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace) private workspaces: Repository<Workspace>,
    @InjectRepository(WorkspaceMember) private members: Repository<WorkspaceMember>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
    private dataSource: DataSource,
    private email: EmailService,
    private config: ConfigService,
    private billing: BillingService,
  ) {}

  async listForUser(userId: string) {
    const memberships = await this.members.find({ where: { userId, status: 'active' }, relations: ['workspace'] });
    return memberships
      .filter((m) => m.workspace && !m.workspace.deletedAt)
      .map((m) => ({ ...m.workspace, role: m.role }));
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    return this.dataSource.transaction(async (m) => {
      const ws = m.create(Workspace, {
        name: dto.name,
        slug: `${slugify(dto.name)}-${randomToken(3)}`,
        ownerId: userId,
        timezone: dto.timezone || 'Asia/Kolkata',
      });
      await m.save(ws);
      await m.save(m.create(WorkspaceMember, { workspaceId: ws.id, userId, role: 'owner', status: 'active' }));
      return { ...ws, role: 'owner' };
    });
  }

  async findOne(workspaceId: string) {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto, userId: string) {
    await this.workspaces.update(workspaceId, dto);
    await this.log(workspaceId, userId, 'workspace.updated', 'workspace', workspaceId, dto);
    return this.findOne(workspaceId);
  }

  async remove(workspaceId: string, userId: string) {
    const ws = await this.findOne(workspaceId);
    if (ws.ownerId !== userId) throw new ForbiddenException('Only the owner can delete a workspace');
    await this.workspaces.softDelete(workspaceId);
    await this.log(workspaceId, userId, 'workspace.deleted', 'workspace', workspaceId, null);
    return { message: 'Workspace deleted' };
  }

  // ---- team ----
  async listMembers(workspaceId: string) {
    const members = await this.members.find({ where: { workspaceId }, relations: ['user'] });
    return members.map((m) => ({
      id: m.id, workspaceId: m.workspaceId, userId: m.userId, role: m.role, status: m.status,
      invitedEmail: m.invitedEmail, createdAt: m.createdAt,
      user: m.user ? { id: m.user.id, email: m.user.email, firstName: m.user.firstName, lastName: m.user.lastName } : undefined,
    }));
  }

  async invite(workspaceId: string, dto: InviteMemberDto, invitedBy: string) {
    await this.billing.assertQuota(workspaceId, 'members');
    const email = dto.email.toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    if (user) {
      const existing = await this.members.findOne({ where: { workspaceId, userId: user.id } });
      if (existing) throw new BadRequestException('This person is already in the workspace');
      const m = await this.members.save(this.members.create({
        workspaceId, userId: user.id, role: dto.role, status: 'active', invitedEmail: email,
      }));
      await this.notify(email, workspaceId);
      await this.log(workspaceId, invitedBy, 'member.added', 'workspace_member', m.id, { email, role: dto.role });
      return m;
    }
    // No account yet — hold an invite the user claims after registering.
    const token = randomToken(24);
    const m = await this.members.save(this.members.create({
      workspaceId, userId: null, role: dto.role, status: 'invited', invitedEmail: email, inviteToken: token,
    }));
    await this.notify(email, workspaceId, token);
    return m;
  }

  async updateMember(workspaceId: string, memberId: string, dto: UpdateMemberDto, actorId: string) {
    const member = await this.members.findOne({ where: { id: memberId, workspaceId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner' && (dto.role || dto.status)) {
      throw new BadRequestException('The owner cannot be changed or disabled');
    }

    if (dto.role) await this.members.update(memberId, { role: dto.role });

    if (dto.status) {
      await this.members.update(memberId, { status: dto.status });
      if (dto.status === 'disabled' && member.userId) {
        // Also kill any active sessions so a disabled member is logged out immediately.
        await this.dataSource.getRepository(RefreshToken).update({ userId: member.userId }, { revokedAt: new Date() });
      }
      await this.log(workspaceId, actorId, dto.status === 'disabled' ? 'member.disabled' : 'member.enabled', 'workspace_member', memberId, null);
    }

    if ((dto.firstName || dto.lastName) && member.userId) {
      await this.users.update(member.userId, {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName ? { lastName: dto.lastName } : {}),
      });
    }

    if (dto.role) await this.log(workspaceId, actorId, 'member.role_changed', 'workspace_member', memberId, dto);
    return { message: 'Member updated' };
  }

  /**
   * Creates a login and attaches it to this workspace in one step. If the person
   * already has a MailFlow account we attach that account rather than refusing —
   * one human, one login, many workspaces.
   */
  async createMemberLogin(workspaceId: string, dto: CreateMemberLoginDto, actorId: string) {
    await this.billing.assertQuota(workspaceId, 'members');
    const email = dto.email.toLowerCase().trim();

    let user = await this.users.findOne({ where: { email } });
    let generatedPassword: string | null = null;

    if (!user) {
      generatedPassword = dto.password || `mf-${randomToken(6)}`;
      user = await this.users.save(this.users.create({
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: await bcrypt.hash(generatedPassword, 12),
        emailVerified: true,        // an admin vouched for this address
        mustChangePassword: true,
        createdBy: actorId,
      }));
    }

    const existing = await this.members.findOne({ where: { workspaceId, userId: user.id } });
    if (existing) throw new BadRequestException('This person is already in the workspace');

    const member = await this.members.save(this.members.create({
      workspaceId, userId: user.id, role: dto.role, status: 'active', invitedEmail: email,
    }));

    if (generatedPassword && dto.sendCredentials !== false) {
      const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
      await this.email.sendSystem(
        email,
        `Your MailFlow login for ${ws?.name}`,
        `<p>An account was created for you on <b>${ws?.name}</b>.</p>
         <p>Email: <b>${email}</b><br>Temporary password: <b>${generatedPassword}</b></p>
         <p>You will be asked to change it after signing in.</p>
         <p><a href="${this.config.get('appBaseUrl')}/login">Sign in to MailFlow</a></p>`,
      ).catch(() => null);
    }

    await this.log(workspaceId, actorId, 'member.created', 'workspace_member', member.id, { email, role: dto.role });

    return {
      id: member.id, role: member.role, status: member.status,
      email, firstName: user.firstName, lastName: user.lastName,
      // Returned once so an admin can hand it over if the email does not arrive.
      temporaryPassword: generatedPassword,
      createdAt: member.createdAt,
    };
  }

  /** Admin-initiated password reset for a member of this workspace. */
  async resetMemberPassword(workspaceId: string, memberId: string, actorId: string) {
    const member = await this.members.findOne({ where: { id: memberId, workspaceId }, relations: ['user'] });
    if (!member?.userId) throw new NotFoundException('Member not found');
    if (member.role === 'owner') throw new BadRequestException('The owner must reset their own password');

    const password = `mf-${randomToken(6)}`;
    await this.users.update(member.userId, {
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
    });
    await this.log(workspaceId, actorId, 'member.password_reset', 'workspace_member', memberId, null);
    return { temporaryPassword: password, email: member.user?.email };
  }

  async removeMember(workspaceId: string, memberId: string, actorId: string) {
    const member = await this.members.findOne({ where: { id: memberId, workspaceId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') throw new BadRequestException('The owner cannot be removed');
    await this.members.delete(memberId);
    await this.log(workspaceId, actorId, 'member.removed', 'workspace_member', memberId, null);
    return { message: 'Member removed' };
  }

  async auditLogs(workspaceId: string, limit = 100) {
    return this.audit.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: Math.min(limit, 200) });
  }

  async log(workspaceId: string, userId: string, action: string, entityType: string, entityId: string, metadata: any) {
    await this.audit.save(this.audit.create({ workspaceId, userId, action, entityType, entityId, metadata }));
  }

  private async notify(email: string, workspaceId: string, token?: string) {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    const url = token
      ? `${this.config.get('appBaseUrl')}/register?invite=${token}`
      : `${this.config.get('appBaseUrl')}/dashboard`;
    await this.email.sendSystem(email, `You've been added to ${ws?.name} on MailFlow`,
      `<p>You now have access to <b>${ws?.name}</b>.</p><p><a href="${url}">Open MailFlow</a></p>`).catch(() => null);
  }
}
