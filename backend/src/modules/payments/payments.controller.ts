import {
  BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser, Public, Roles, WorkspaceId } from '@/common/decorators';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { Workspace } from '@/database/entities';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { BillingDetailsDto, CheckoutDto, VerifyPaymentDto } from './dto';

@Controller()
export class PaymentsController {
  constructor(
    private svc: PaymentsService,
    private razorpay: RazorpayService,
    @InjectRepository(Workspace) private workspaces: Repository<Workspace>,
  ) {}

  /** Lets the frontend know whether to render a pay button at all. */
  @Public() @Get('payments/config')
  config() { return this.svc.publicConfig; }

  @Post('payments/checkout')
  @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('owner')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkout(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: CheckoutDto) {
    return this.svc.checkout(ws, uid, dto);
  }

  @Post('payments/verify')
  @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('owner')
  verify(@WorkspaceId() ws: string, @Body() dto: VerifyPaymentDto) {
    return this.svc.verify(ws, dto);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  history(@WorkspaceId() ws: string, @Query() q: PaginationDto) { return this.svc.history(ws, q); }

  @Get('payments/:id/invoice')
  @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  invoice(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.invoice(ws, id);
  }

  @Patch('billing/details')
  @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  async saveDetails(@WorkspaceId() ws: string, @Body() dto: BillingDetailsDto) {
    await this.workspaces.update(ws, dto);
    return this.workspaces.findOne({ where: { id: ws } });
  }

  /**
   * Razorpay webhook. Public by necessity, so the signature over the raw body is
   * the only thing standing between this and a forged activation.
   */
  @Public() @Post('webhooks/razorpay')
  async webhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
    @Req() req: Request & { rawBody?: string },
  ) {
    const raw = req.rawBody ?? JSON.stringify(body);
    if (!this.razorpay.verifyWebhookSignature(raw, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    // Razorpay retries on non-2xx, so failures here are recoverable by design.
    return this.svc.handleWebhook(body?.event, body?.payload);
  }
}
