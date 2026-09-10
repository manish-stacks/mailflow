import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/database/entities';

/**
 * Baseline gate for the whole /admin area: a true super admin, OR a staff
 * account that's been granted at least one delegated permission. Individual
 * routes then narrow further with PermissionGuard + @RequirePermission(...).
 */
@Injectable()
export class PlatformStaffGuard implements CanActivate {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user?.id) throw new ForbiddenException();
    const user = await this.users.findOne({ where: { id: req.user.id } });
    const permissions = user?.isSuperAdmin ? ['*'] : user?.adminPermissions || [];
    if (!user || (!user.isSuperAdmin && permissions.length === 0)) {
      throw new ForbiddenException('Platform administrator access required');
    }
    req.superAdmin = user;
    req.adminPermissions = permissions;
    return true;
  }
}
