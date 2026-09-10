import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { CreateSegmentDto, PreviewSegmentDto, UpdateSegmentDto } from './dto';
import { FIELD_MAP, OPERATORS_BY_KIND } from './segment-rules';
import { SegmentsService } from './segments.service';

@Controller('segments')
@UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
export class SegmentsController {
  constructor(private svc: SegmentsService) {}

  /** Powers the rule builder dropdowns so the UI can never offer an unsupported combination. */
  @Get('schema')
  schema() {
    return {
      fields: Object.entries(FIELD_MAP).map(([key, v]) => ({ key, kind: v.kind, operators: OPERATORS_BY_KIND[v.kind] })),
      supportsCustomAttributes: true,
    };
  }

  @Get()
  findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }

  @Get(':id')
  findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Get(':id/count')
  count(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.count(ws, id); }

  @Post() @Roles('editor')
  create(@WorkspaceId() ws: string, @Body() dto: CreateSegmentDto) { return this.svc.create(ws, dto as any); }

  @Post('preview')
  previewNew(@WorkspaceId() ws: string, @Body() dto: PreviewSegmentDto) { return this.svc.preview(ws, dto as any); }

  @Post(':id/preview')
  preview(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PreviewSegmentDto) {
    return this.svc.preview(ws, dto as any);
  }

  @Patch(':id') @Roles('editor')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSegmentDto) {
    return this.svc.update(ws, id, dto as any);
  }

  @Delete(':id') @Roles('editor')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }
}
