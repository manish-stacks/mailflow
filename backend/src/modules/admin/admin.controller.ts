import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { CurrentUser } from '@/common/decorators';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '@/common/guards/super-admin.guard';
import { BillingService } from '@/modules/billing/billing.service';
import { AssignPlanDto, PlanDto, UpdatePlanDto } from '@/modules/billing/dto';
import { AdminService } from './admin.service';

class QueryWorkspacesDto extends PaginationDto {
  @IsOptional() @IsIn(['active', 'suspended']) status?: string;
  @IsOptional() @IsString() plan?: string;
}
class ProvisionClientDto {
  @IsString() @MinLength(2) workspaceName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(1) firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsIn(['monthly', 'yearly', 'lifetime', 'free']) billingCycle?: any;
  @IsOptional() @IsInt() @Min(0) trialDays?: number;
}
class GrantAdminDto { @IsEmail() email: string; }
class WorkspaceStatusDto { @IsIn(['active', 'suspended']) status: 'active' | 'suspended'; }

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private svc: AdminService, private billing: BillingService) {}

  @Get('stats') stats() { return this.svc.stats(); }

  /* ------------------------------------------------------------ plans */
  @Get('plans') plans() { return this.billing.listAll(); }

  @Post('plans')
  createPlan(@Body() dto: PlanDto) { return this.billing.createPlan(dto as any); }

  @Patch('plans/:id')
  updatePlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.billing.updatePlan(id, dto as any);
  }

  @Delete('plans/:id')
  archivePlan(@Param('id', ParseUUIDPipe) id: string) { return this.billing.archivePlan(id); }

  /* ------------------------------------------------------- workspaces */
  @Get('workspaces')
  workspaces(@Query() q: QueryWorkspacesDto) { return this.svc.listWorkspaces(q as any); }

  @Get('workspaces/:id')
  workspace(@Param('id', ParseUUIDPipe) id: string) { return this.svc.workspaceDetail(id); }

  @Post('workspaces/:id/plan')
  assignPlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignPlanDto) {
    return this.svc.assignPlan(id, dto.plan, dto);
  }

  @Patch('workspaces/:id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WorkspaceStatusDto) {
    return this.svc.setWorkspaceStatus(id, dto.status);
  }

  /** One call: client login + workspace + plan. */
  @Post('clients')
  provision(@Body() dto: ProvisionClientDto, @CurrentUser('id') uid: string) {
    return this.svc.provisionClient(dto, uid);
  }

  /* -------------------------------------------------------- operators */
  @Get('admins') admins() { return this.svc.listAdmins(); }

  @Post('admins')
  grant(@Body() dto: GrantAdminDto) { return this.svc.grantAdmin(dto.email); }

  @Delete('admins/:id')
  revoke(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') uid: string) {
    return this.svc.revokeAdmin(id, uid);
  }
}
