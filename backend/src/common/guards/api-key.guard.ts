import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, isObservable } from 'rxjs';
import { ApiKeysService } from '@/modules/apikeys/apikeys.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Accepts EITHER:
 *  - an API key via `x-api-key: mf_xxx.yyy` (or `Authorization: Bearer mf_xxx.yyy`), or
 *  - a normal logged-in session JWT (falls back to JwtAuthGuard).
 *
 * On API-key success it sets req.workspaceId directly from the key (no
 * x-workspace-id header needed) and marks req.apiKeyAuth so WorkspaceGuard
 * trusts it instead of doing a membership lookup.
 */
@Injectable()
export class ApiKeyAuthGuard extends JwtAuthGuard {
  constructor(reflector: Reflector, private apiKeys: ApiKeysService) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const bearer = req.headers['authorization']?.startsWith('Bearer mf_')
      ? req.headers['authorization'].slice(7)
      : undefined;
    const rawKey = req.headers['x-api-key'] || bearer;

    if (rawKey) {
      const key = await this.apiKeys.validate(rawKey);
      if (!key) throw new UnauthorizedException('Invalid or revoked API key');
      req.user = { id: key.createdBy };
      req.workspaceId = key.workspaceId;
      req.apiKeyAuth = true;
      return true;
    }

    const result = super.canActivate(context);
    return isObservable(result) ? firstValueFrom(result) : result;
  }
}
