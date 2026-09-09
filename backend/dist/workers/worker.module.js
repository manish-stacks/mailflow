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
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const configuration_1 = __importDefault(require("../config/configuration"));
const database_module_1 = require("../database/database.module");
const email_module_1 = require("../integrations/email/email.module");
const queue_module_1 = require("../queues/queue.module");
const analytics_module_1 = require("../modules/analytics/analytics.module");
const campaigns_module_1 = require("../modules/campaigns/campaigns.module");
const storage_module_1 = require("../modules/storage/storage.module");
const webhooks_module_1 = require("../modules/webhooks/webhooks.module");
const csv_import_processor_1 = require("./csv-import.processor");
const mail_connection_module_1 = require("../modules/mail-connection/mail-connection.module");
const billing_module_1 = require("../modules/billing/billing.module");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            database_module_1.DatabaseModule, email_module_1.EmailModule, queue_module_1.QueueModule, storage_module_1.StorageModule,
            campaigns_module_1.CampaignsModule, analytics_module_1.AnalyticsModule, webhooks_module_1.WebhooksModule, mail_connection_module_1.MailConnectionModule, billing_module_1.BillingModule
        ],
        providers: [csv_import_processor_1.CsvImportProcessor],
    })
], WorkerModule);
