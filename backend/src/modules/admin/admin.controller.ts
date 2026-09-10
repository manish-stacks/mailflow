import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsISO8601, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { CurrentUser, RequirePermission } from '@/common/decorators';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '@/common/guards/super-admin.guard';
import { PlatformStaffGuard } from '@/common/guards/platform-staff.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import type { AdminPermission } from '@/common/permissions';
import { BillingService } from '@/modules/billing/billing.service';
import { AssignPlanDto, PlanDto, UpdatePlanDto } from '@/modules/billing/dto';
import { AdminService } from './admin.service';

class QueryWorkspacesDto extends PaginationDto {
  @IsOptional() @IsIn(['active', 'suspended']) status?: string;
  @IsOptional() @IsString() plan?: string;
}
class QueryPaymentsDto extends PaginationDto {
  @IsOptional() @IsIn(['created', 'pending', 'paid', 'failed', 'refunded']) status?: string;
  @IsOptional() @IsString() workspaceId?: string;
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
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
class GrantAdminDto {
  @IsEmail() email: string;
  @IsOptional() @IsBoolean() full?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) permissions?: AdminPermission[];
}
class UpdatePermissionsDto { @IsArray() @IsString({ each: true }) permissions: AdminPermission[]; }
class WorkspaceStatusDto { @IsIn(['active', 'suspended']) status: 'active' | 'suspended'; }

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformStaffGuard, PermissionGuard)
export class AdminController {
  constructor(private svc: AdminService, private billing: BillingService) {}

  /** Also doubles as the frontend's "am I platform staff at all" access check. */
  @Get('stats') stats() { return this.svc.stats(); }

  @Get('permissions') permissionList() { return this.svc.availablePermissions(); }

  /* ------------------------------------------------------------ plans */
  @Get('plans') @RequirePermission('plans.manage') plans() { return this.billing.listAll(); }

  @Post('plans') @RequirePermission('plans.manage')
  createPlan(@Body() dto: PlanDto) { return this.billing.createPlan(dto as any); }

  @Patch('plans/:id') @RequirePermission('plans.manage')
  updatePlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.billing.updatePlan(id, dto as any);
  }

  @Delete('plans/:id') @RequirePermission('plans.manage')
  archivePlan(@Param('id', ParseUUIDPipe) id: string) { return this.billing.archivePlan(id); }

  /* ------------------------------------------------------- workspaces */
  @Get('workspaces') @RequirePermission('workspaces.view')
  workspaces(@Query() q: QueryWorkspacesDto) { return this.svc.listWorkspaces(q as any); }

  @Get('workspaces/:id') @RequirePermission('workspaces.view')
  workspace(@Param('id', ParseUUIDPipe) id: string) { return this.svc.workspaceDetail(id); }

  @Post('workspaces/:id/plan') @RequirePermission('workspaces.manage')
  assignPlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignPlanDto) {
    return this.svc.assignPlan(id, dto.plan, dto);
  }

  @Patch('workspaces/:id/status') @RequirePermission('workspaces.manage')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WorkspaceStatusDto) {
    return this.svc.setWorkspaceStatus(id, dto.status);
  }

  /** One call: client login + workspace + plan. */
  @Post('clients') @RequirePermission('workspaces.manage')
  provision(@Body() dto: ProvisionClientDto, @CurrentUser('id') uid: string) {
    return this.svc.provisionClient(dto, uid);
  }

  /**
   * Logs the admin into the client's own account, no password involved.
   * Meant to be opened in a new tab so the admin's own session stays intact.
   */
  @Post('workspaces/:id/impersonate') @RequirePermission('impersonate')
  impersonate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') uid: string) {
    return this.svc.impersonateWorkspace(id, uid);
  }

  /* -------------------------------------------------------------- payments */
  @Get('payments') @RequirePermission('payments.view')
  payments(@Query() q: QueryPaymentsDto) { return this.svc.listPayments(q as any); }

  /* -------------------------------------------------------- operators */
  // Managing platform admins can create a new super admin, so this stays
  // locked to true super admins regardless of any delegated permission.
  @Get('admins') @UseGuards(SuperAdminGuard) admins() { return this.svc.listAdmins(); }

  @Post('admins') @UseGuards(SuperAdminGuard)
  grant(@Body() dto: GrantAdminDto) { return this.svc.grantAdmin(dto.email, dto); }

  @Patch('admins/:id/permissions') @UseGuards(SuperAdminGuard)
  updatePermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePermissionsDto) {
    return this.svc.updateAdminPermissions(id, dto.permissions);
  }

  @Delete('admins/:id') @UseGuards(SuperAdminGuard)
  revoke(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') uid: string) {
    return this.svc.revokeAdmin(id, uid);
  }
}
