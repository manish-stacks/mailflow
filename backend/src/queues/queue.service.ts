import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, JobsOptions } from 'bullmq';
import { QUEUES, QueueName } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private queues = new Map<QueueName, Queue>();

  constructor(private config: ConfigService) {}

  get connection() {
    const r = this.config.get('redis');
    return { host: r.host, port: r.port, password: r.password, maxRetriesPerRequest: null };
  }

  queue(name: QueueName): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { age: 3600, count: 5000 },
          removeOnFail: { age: 86400 },
        },
      }));
    }
    return this.queues.get(name);
  }

  add<T>(name: QueueName, jobName: string, data: T, opts?: JobsOptions) {
    return this.queue(name).add(jobName, data, opts);
  }

  addBulk<T>(name: QueueName, jobs: Array<{ name: string; data: T; opts?: JobsOptions }>) {
    return this.queue(name).addBulk(jobs);
  }

  async stats(name: QueueName) {
    const q = this.queue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      q.getWaitingCount(), q.getActiveCount(), q.getCompletedCount(), q.getFailedCount(), q.getDelayedCount(),
    ]);
    return { name, waiting, active, completed, failed, delayed };
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}

export { QUEUES };
