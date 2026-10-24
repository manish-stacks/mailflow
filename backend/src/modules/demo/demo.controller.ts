import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, Public, RequirePermission } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { PlatformStaffGuard } from '@/common/guards/platform-staff.guard';
import { CreateDemoRequestDto, QueryDemoRequestsDto, UpdateDemoRequestDto } from './dto';
import { DemoService } from './demo.service';

/** Public — called by the landing page form. Tighter rate limit than the global one. */
@Controller('demo-requests')
export class DemoController {
  constructor(private svc: DemoService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateDemoRequestDto, @Req() req: Request) {
    return this.svc.create(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }
}

/** Platform staff only. Read = workspaces.view, change/delete = workspaces.manage. */
@Controller('admin/demo-requests')
@UseGuards(JwtAuthGuard, PlatformStaffGuard, PermissionGuard)
export class AdminDemoController {
  constructor(private svc: DemoService) {}

  @Get() @RequirePermission('workspaces.view')
  list(@Query() q: QueryDemoRequestsDto) { return this.svc.list(q); }

  @Get('summary') @RequirePermission('workspaces.view')
  summary() { return this.svc.summary(); }

  @Patch(':id') @RequirePermission('workspaces.manage')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDemoRequestDto, @CurrentUser('id') userId: string) {
    return this.svc.update(id, dto, userId);
  }

  @Delete(':id') @RequirePermission('workspaces.manage')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
