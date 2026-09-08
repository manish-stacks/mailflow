import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Public, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { BillingService } from './billing.service';
import { AssignPlanDto } from './dto';

@Controller()
export class BillingController {
  constructor(private svc: BillingService) {}

  /** Pricing page — no auth needed. */
  @Public() @Get('plans')
  plans() { return this.svc.listPublic(); }

  @Get('billing/summary') @UseGuards(JwtAuthGuard, WorkspaceGuard)
  summary(@WorkspaceId() ws: string) { return this.svc.summary(ws); }

  @Get('billing/usage') @UseGuards(JwtAuthGuard, WorkspaceGuard)
  usage(@WorkspaceId() ws: string) { return this.svc.usageFor(ws); }

  @Get('billing/limits') @UseGuards(JwtAuthGuard, WorkspaceGuard)
  limits(@WorkspaceId() ws: string) { return this.svc.limitsFor(ws); }

  /**
   * Self-serve switch to a free plan (including downgrades). Paid plans are
   * refused here on purpose — they go through /payments/checkout, so a plan can
   * never be granted by a client simply calling this endpoint.
   */
  @Post('billing/subscribe') @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('owner')
  async subscribe(@WorkspaceId() ws: string, @Body() dto: AssignPlanDto) {
    const plan = await this.svc.findPlan(dto.plan);
    if (plan.priceMonthly > 0 || plan.priceYearly > 0) {
      throw new BadRequestException('This plan requires payment — start a checkout instead');
    }
    return this.svc.assignPlan(ws, plan.id, { ...dto, billingCycle: 'free' });
  }

  @Post('billing/cancel') @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('owner')
  cancel(@WorkspaceId() ws: string) { return this.svc.cancel(ws); }
}
