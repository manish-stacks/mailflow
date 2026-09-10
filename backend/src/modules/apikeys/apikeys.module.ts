import { Global, Module } from '@nestjs/common';
import { ApiKeysController } from './apikeys.controller';
import { ApiKeysService } from './apikeys.service';

// Global so ApiKeyAuthGuard can be used on any controller without every
// feature module having to import ApiKeysModule individually.
@Global()
@Module({ controllers: [ApiKeysController], providers: [ApiKeysService], exports: [ApiKeysService] })
export class ApiKeysModule {}
