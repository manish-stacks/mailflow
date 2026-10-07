import { Module } from '@nestjs/common';
import { SendersModule } from '@/modules/senders/senders.module';
import { ApiKeysModule } from '@/modules/apikeys/apikeys.module';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';

@Module({
  imports: [SendersModule, ApiKeysModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
