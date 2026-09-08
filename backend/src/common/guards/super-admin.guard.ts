import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/database/entities';

/**
 * Platform operator only — the agency running MailFlow. This is deliberately
 * separate from workspace roles: an owner of one workspace has no reach here.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user?.id) throw new ForbiddenException();
    const user = await this.users.findOne({ where: { id: req.user.id } });
    if (!user?.isSuperAdmin) throw new ForbiddenException('Platform administrator access required');
    req.superAdmin = user;
    return true;
  }
}
