"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const analytics_service_1 = require("../modules/analytics/analytics.service");
const campaign_dispatch_service_1 = require("../modules/campaigns/campaign-dispatch.service");
const webhooks_service_1 = require("../modules/webhooks/webhooks.service");
const queue_constants_1 = require("../queues/queue.constants");
const queue_service_1 = require("../queues/queue.service");
const csv_import_processor_1 = require("./csv-import.processor");
const worker_module_1 = require("./worker.module");
/**
 * Standalone worker process. Run alongside the API:
 *   npm run worker
 */
async function bootstrap() {
    const logger = new common_1.Logger('Worker');
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule, { logger: ['log', 'warn', 'error'] });
    const queues = app.get(queue_service_1.QueueService);
    const dispatch = app.get(campaign_dispatch_service_1.CampaignDispatchService);
    const csv = app.get(csv_import_processor_1.CsvImportProcessor);
    const webhooks = app.get(webhooks_service_1.WebhooksService);
    const analytics = app.get(analytics_service_1.AnalyticsService);
    const config = app.get(config_1.ConfigService);
    const connection = queues.connection;
    const workers = [
        new bullmq_1.Worker(queue_constants_1.QUEUES.CAMPAIGN_PREPARATION, async (job) => {
            await dispatch.prepare(job.data.campaignId, job.data.workspaceId);
        }, { connection, concurrency: 2 }),
        new bullmq_1.Worker(queue_constants_1.QUEUES.EMAIL_SENDING, async (job) => {
            const ok = await dispatch.dispatch(job.data.recipientId, job.data.campaignId, job.data.workspaceId);
            if (!ok)
                throw new Error('Transient send failure — retrying');
        }, {
            connection,
            concurrency: 10,
            // Provider-friendly throttle, configurable per deployment.
            limiter: { max: config.get('email.ratePerMinute'), duration: 60_000 },
        }),
        new bullmq_1.Worker(queue_constants_1.QUEUES.SCHEDULED_CAMPAIGNS, async (job) => {
            await dispatch.prepare(job.data.campaignId, job.data.workspaceId);
        }, { connection, concurrency: 2 }),
        new bullmq_1.Worker(queue_constants_1.QUEUES.CSV_IMPORT, async (job) => {
            await csv.run(job.data.importJobId, job.data.workspaceId);
        }, { connection, concurrency: 2 }),
        new bullmq_1.Worker(queue_constants_1.QUEUES.ANALYTICS_PROCESSING, async (job) => {
            if (job.data.type === 'webhook')
                await webhooks.process(job.data.payload);
            if (job.data.type === 'recount')
                await analytics.recount(job.data.payload.campaignId);
        }, { connection, concurrency: 5 }),
    ];
    workers.forEach((w) => {
        w.on('failed', (job, err) => logger.warn(`[${w.name}] job ${job?.id} failed: ${err.message}`));
        w.on('completed', (job) => logger.debug(`[${w.name}] job ${job.id} done`));
    });
    logger.log(`Workers online: ${workers.map((w) => w.name).join(', ')}`);
    const shutdown = async () => {
        logger.log('Shutting down workers...');
        await Promise.all(workers.map((w) => w.close()));
        await app.close();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
bootstrap();
