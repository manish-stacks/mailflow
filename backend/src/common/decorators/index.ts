import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { WorkspaceRole } from '@/database/entities';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return data ? req.user?.[data] : req.user;
});

/** Injects the resolved workspace id (validated by WorkspaceGuard). */
export const WorkspaceId = createParamDecorator((_d, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().workspaceId as string;
});

export const Membership = createParamDecorator((_d, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().membership;
});
