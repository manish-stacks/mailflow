import { Module } from '@nestjs/common';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { ApiKeysModule } from '@/modules/apikeys/apikeys.module';
import { SegmentsModule } from '@/modules/segments/segments.module';
import { SendersModule } from '@/modules/senders/senders.module';
import { SuppressionModule } from '@/modules/suppression/suppression.module';
import { CampaignDispatchService } from './campaign-dispatch.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [SegmentsModule, SendersModule, AnalyticsModule, SuppressionModule, ApiKeysModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignDispatchService],
  exports: [CampaignsService, CampaignDispatchService],
})
export class CampaignsModule {}