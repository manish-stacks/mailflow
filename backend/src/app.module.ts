import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './integrations/email/email.module';
import { QueueModule } from './queues/queue.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApiKeysModule } from './modules/apikeys/apikeys.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DomainsModule } from './modules/domains/domains.module';
import { ImportModule } from './modules/import/import.module';
import { ListsModule } from './modules/lists/lists.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { SendersModule } from './modules/senders/senders.module';
import { StorageModule } from './modules/storage/storage.module';
import { SuppressionModule } from './modules/suppression/suppression.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { UnsubscribeModule } from './modules/unsubscribe/unsubscribe.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { BillingModule } from './modules/billing/billing.module';
import { MailConnectionModule } from './modules/mail-connection/mail-connection.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    EmailModule,
    QueueModule,
    StorageModule,
    AuthModule,
    BillingModule,
    MailConnectionModule,
    AdminModule,
    PaymentsModule,
    WorkspacesModule,
    ContactsModule,
    ListsModule,
    SegmentsModule,
    ImportModule,
    SendersModule,
    DomainsModule,
    TemplatesModule,
    CampaignsModule,
    AiModule,
    AnalyticsModule,
    TrackingModule,
    WebhooksModule,
    UnsubscribeModule,
    SuppressionModule,
    ApiKeysModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
