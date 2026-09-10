import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERMISSION_KEY } from '@/common/decorators';
import type { AdminPermission } from '@/common/permissions';

/** Runs after PlatformStaffGuard; checks the specific permission a route declares. */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermission>(ADMIN_PERMISSION_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required) return true;
    const req = ctx.switchToHttp().getRequest();
    const granted: string[] = req.adminPermissions || [];
    if (granted.includes('*') || granted.includes(required)) return true;
    throw new ForbiddenException('You do not have permission to do this');
  }
}
