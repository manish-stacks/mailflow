"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const configuration_1 = __importDefault(require("./config/configuration"));
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const database_module_1 = require("./database/database.module");
const email_module_1 = require("./integrations/email/email.module");
const queue_module_1 = require("./queues/queue.module");
const ai_module_1 = require("./modules/ai/ai.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const apikeys_module_1 = require("./modules/apikeys/apikeys.module");
const auth_module_1 = require("./modules/auth/auth.module");
const campaigns_module_1 = require("./modules/campaigns/campaigns.module");
const contacts_module_1 = require("./modules/contacts/contacts.module");
const domains_module_1 = require("./modules/domains/domains.module");
const import_module_1 = require("./modules/import/import.module");
const lists_module_1 = require("./modules/lists/lists.module");
const segments_module_1 = require("./modules/segments/segments.module");
const senders_module_1 = require("./modules/senders/senders.module");
const storage_module_1 = require("./modules/storage/storage.module");
const suppression_module_1 = require("./modules/suppression/suppression.module");
const templates_module_1 = require("./modules/templates/templates.module");
const tracking_module_1 = require("./modules/tracking/tracking.module");
const unsubscribe_module_1 = require("./modules/unsubscribe/unsubscribe.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const billing_module_1 = require("./modules/billing/billing.module");
const mail_connection_module_1 = require("./modules/mail-connection/mail-connection.module");
const admin_module_1 = require("./modules/admin/admin.module");
const payments_module_1 = require("./modules/payments/payments.module");
const workspaces_module_1 = require("./modules/workspaces/workspaces.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            database_module_1.DatabaseModule,
            email_module_1.EmailModule,
            queue_module_1.QueueModule,
            storage_module_1.StorageModule,
            auth_module_1.AuthModule,
            billing_module_1.BillingModule,
            mail_connection_module_1.MailConnectionModule,
            admin_module_1.AdminModule,
            payments_module_1.PaymentsModule,
            workspaces_module_1.WorkspacesModule,
            contacts_module_1.ContactsModule,
            lists_module_1.ListsModule,
            segments_module_1.SegmentsModule,
            import_module_1.ImportModule,
            senders_module_1.SendersModule,
            domains_module_1.DomainsModule,
            templates_module_1.TemplatesModule,
            campaigns_module_1.CampaignsModule,
            ai_module_1.AiModule,
            analytics_module_1.AnalyticsModule,
            tracking_module_1.TrackingModule,
            webhooks_module_1.WebhooksModule,
            unsubscribe_module_1.UnsubscribeModule,
            suppression_module_1.SuppressionModule,
            apikeys_module_1.ApiKeysModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.AllExceptionsFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: transform_interceptor_1.TransformInterceptor },
        ],
    })
], AppModule);
