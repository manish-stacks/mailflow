import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { randomToken } from '@/common/tokens';
import { ApiKey } from '@/database/entities';

@Injectable()
export class ApiKeysService {
  constructor(@InjectRepository(ApiKey) private keys: Repository<ApiKey>) {}

  async findAll(workspaceId: string) {
    const rows = await this.keys.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
    return rows.map(({ keyHash, ...rest }) => rest); // the hash never leaves the server
  }

  /** The plaintext key is returned exactly once, at creation. */
  async create(workspaceId: string, userId: string, name: string, scopes: string[] = ['read']) {
    const secret = randomToken(24);
    const prefix = `mf_${secret.slice(0, 8)}`;
    const plain = `${prefix}.${secret}`;
    const key = await this.keys.save(this.keys.create({
      workspaceId, name, keyPrefix: prefix, keyHash: await bcrypt.hash(plain, 10), scopes, createdBy: userId,
    }));
    const { keyHash, ...rest } = key;
    return { ...rest, key: plain };
  }

  async revoke(workspaceId: string, id: string) {
    const key = await this.keys.findOne({ where: { id, workspaceId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.keys.update(id, { revokedAt: new Date() });
    return { message: 'API key revoked' };
  }

  async validate(plain: string): Promise<ApiKey | null> {
    const prefix = plain.split('.')[0];
    const candidates = await this.keys.find({ where: { keyPrefix: prefix, revokedAt: IsNull() } });
    for (const c of candidates) {
      if (await bcrypt.compare(plain, c.keyHash)) {
        await this.keys.update(c.id, { lastUsedAt: new Date() });
        return c;
      }
    }
    return null;
  }
}
