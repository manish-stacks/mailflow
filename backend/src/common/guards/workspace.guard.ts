import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember, WorkspaceRole } from '@/database/entities';
import { ROLES_KEY } from '../decorators';

const RANK: Record<WorkspaceRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

/**
 * Resolves the active workspace from the `x-workspace-id` header (or ?workspaceId)
 * and guarantees the authenticated user is an active member with a sufficient role.
 * This is the single choke point for tenant isolation.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(WorkspaceMember) private members: Repository<WorkspaceMember>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const workspaceId: string = req.headers['x-workspace-id'] || req.query?.workspaceId;
    if (!workspaceId) throw new BadRequestException('Missing x-workspace-id header');
    if (!req.user?.id) throw new ForbiddenException();

    const membership = await this.members.findOne({
      where: { workspaceId, userId: req.user.id, status: 'active' },
    });
    if (!membership) throw new ForbiddenException('You do not have access to this workspace');

    const required = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (required?.length) {
      const min = Math.min(...required.map((r) => RANK[r]));
      if (RANK[membership.role] < min) throw new ForbiddenException('Insufficient role');
    }

    req.workspaceId = workspaceId;
    req.membership = membership;
    return true;
  }
}
