import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { AutomationsService } from './automations.service';
import { SaveAutomationDto } from './dto';

@Controller('automations')
@UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
export class AutomationsController {
  constructor(private svc: AutomationsService) {}

  @Get() findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }
  @Get(':id') findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }
  @Get(':id/stats') stats(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.stats(ws, id); }

  @Post() @Roles('editor')
  create(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: SaveAutomationDto) { return this.svc.create(ws, uid, dto); }

  @Patch(':id') @Roles('editor')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveAutomationDto) { return this.svc.update(ws, id, dto); }

  @Post(':id/activate') @Roles('editor')
  activate(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.activate(ws, id); }

  @Post(':id/pause') @Roles('editor')
  pause(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.pause(ws, id); }

  @Delete(':id') @Roles('editor')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }
}
