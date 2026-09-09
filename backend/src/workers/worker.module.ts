
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/config/configuration';
import { DatabaseModule } from '@/database/database.module';
import { EmailModule } from '@/integrations/email/email.module';
import { QueueModule } from '@/queues/queue.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { CampaignsModule } from '@/modules/campaigns/campaigns.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { WebhooksModule } from '@/modules/webhooks/webhooks.module';
import { CsvImportProcessor } from './csv-import.processor';
import { MailConnectionModule } from '@/modules/mail-connection/mail-connection.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule, EmailModule, QueueModule, StorageModule,
    CampaignsModule, AnalyticsModule, WebhooksModule, MailConnectionModule,BillingModule
  ],
  providers: [CsvImportProcessor],
})
export class WorkerModule { }
