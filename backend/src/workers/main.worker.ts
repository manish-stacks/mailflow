import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { CampaignDispatchService } from '@/modules/campaigns/campaign-dispatch.service';
import { WebhooksService } from '@/modules/webhooks/webhooks.service';
import { QUEUES } from '@/queues/queue.constants';
import { QueueService } from '@/queues/queue.service';
import { CsvImportProcessor } from './csv-import.processor';
import { WorkerModule } from './worker.module';

/**
 * Standalone worker process. Run alongside the API:
 *   npm run worker
 */
async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: ['log', 'warn', 'error'] });

  const queues = app.get(QueueService);
  const dispatch = app.get(CampaignDispatchService);
  const csv = app.get(CsvImportProcessor);
  const webhooks = app.get(WebhooksService);
  const analytics = app.get(AnalyticsService);
  const config = app.get(ConfigService);
  const connection = queues.connection;

  const workers: Worker[] = [
    new Worker(QUEUES.CAMPAIGN_PREPARATION, async (job) => {
      await dispatch.prepare(job.data.campaignId, job.data.workspaceId);
    }, { connection, concurrency: 2 }),

    new Worker(QUEUES.EMAIL_SENDING, async (job) => {
      const ok = await dispatch.dispatch(job.data.recipientId, job.data.campaignId, job.data.workspaceId);
      if (!ok) throw new Error('Transient send failure — retrying');
    }, {
      connection,
      concurrency: 10,
      // Provider-friendly throttle, configurable per deployment.
      limiter: { max: config.get('email.ratePerMinute'), duration: 60_000 },
    }),

    new Worker(QUEUES.SCHEDULED_CAMPAIGNS, async (job) => {
      await dispatch.prepare(job.data.campaignId, job.data.workspaceId);
    }, { connection, concurrency: 2 }),

    new Worker(QUEUES.CSV_IMPORT, async (job) => {
      await csv.run(job.data.importJobId, job.data.workspaceId);
    }, { connection, concurrency: 2 }),

    new Worker(QUEUES.ANALYTICS_PROCESSING, async (job) => {
      if (job.data.type === 'webhook') await webhooks.process(job.data.payload);
      if (job.data.type === 'recount') await analytics.recount(job.data.payload.campaignId);
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
