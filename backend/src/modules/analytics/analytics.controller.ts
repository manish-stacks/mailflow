import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}

  @Get('overview')
  overview(@WorkspaceId() ws: string, @Query('days') days = '30') { return this.svc.overview(ws, +days || 30); }

  @Get('timeseries')
  timeseries(@WorkspaceId() ws: string, @Query('days') days = '30') { return this.svc.timeseries(ws, +days || 30); }

  @Get('recent-campaigns')
  recent(@WorkspaceId() ws: string, @Query('limit') limit = '5') { return this.svc.recentCampaigns(ws, +limit || 5); }
}
