import { BadRequestException, Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '@/common/decorators';
import { QueueService } from '@/queues/queue.service';
import { QUEUES } from '@/queues/queue.constants';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private svc: WebhooksService, private queue: QueueService) {}

  /** Signature-checked, then handed to a queue so the provider gets a fast 200. */
  @Public() @Post('email/:provider')
  async receive(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, any>,
    @Body() body: any,
    @Req() req: Request & { rawBody?: string },
  ) {
    const raw = req.rawBody ?? JSON.stringify(body);
    if (!this.svc.verify(provider, headers, raw)) throw new BadRequestException('Invalid webhook signature');

    const events = this.svc.parse(body);
    await this.queue.addBulk(QUEUES.ANALYTICS_PROCESSING,
      events.map((e) => ({ name: 'webhook-event', data: { type: 'webhook', payload: e } })));
    return { received: events.length };
  }
}
