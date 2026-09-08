import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, QueryCampaignsDto, ScheduleCampaignDto, TestCampaignDto, UpdateCampaignDto } from './dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CampaignsController {
  constructor(private svc: CampaignsService, private analytics: AnalyticsService) {}

  @Get() findAll(@WorkspaceId() ws: string, @Query() q: QueryCampaignsDto) { return this.svc.findAll(ws, q); }

  @Get(':id') findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Post() @Roles('editor')
  create(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: CreateCampaignDto) {
    return this.svc.create(ws, uid, dto);
  }

  @Patch(':id') @Roles('editor')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this.svc.update(ws, id, dto);
  }

  @Delete(':id') @Roles('editor')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }

  @Post(':id/duplicate') @Roles('editor')
  duplicate(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') uid: string) {
    return this.svc.duplicate(ws, id, uid);
  }

  @Get(':id/audience')
  audience(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.estimateAudience(ws, id); }

  @Get(':id/validate')
  validate(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.validate(ws, id); }

  @Post(':id/test') @Roles('editor')
  test(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TestCampaignDto) {
    return this.svc.sendTest(ws, id, dto.recipients);
  }

  @Post(':id/send') @Roles('editor')
  send(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.send(ws, id); }

  @Post(':id/schedule') @Roles('editor')
  schedule(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ScheduleCampaignDto) {
    return this.svc.schedule(ws, id, dto.scheduledAt);
  }

  @Post(':id/pause') @Roles('editor')
  pause(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.pause(ws, id); }

  @Post(':id/resume') @Roles('editor')
  resume(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.resume(ws, id); }

  @Post(':id/cancel') @Roles('editor')
  cancel(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.cancel(ws, id); }

  @Get(':id/recipients')
  recipients(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Query() q: PaginationDto & { status?: string }) {
    return this.svc.recipients_(ws, id, q as any);
  }

  @Get(':id/analytics')
  stats(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.analytics.campaign(ws, id); }

  @Get(':id/links')
  links(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.analytics.campaignLinks(ws, id); }

  @Get(':id/activity')
  activity(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Query('limit') limit?: string) {
    return this.analytics.campaignActivity(ws, id, limit ? +limit : 100);
  }
}
