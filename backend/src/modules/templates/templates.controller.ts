import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { TemplatesService } from './templates.service';

class CreateTemplateDto {
  @IsString() @MaxLength(150) name: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(255) subject?: string;
  @IsOptional() @IsString() @MaxLength(255) previewText?: string;
  @IsOptional() @IsString() htmlContent?: string;
  @IsOptional() @IsObject() designJson?: any;
}
class UpdateTemplateDto extends CreateTemplateDto { @IsOptional() @IsString() @MaxLength(150) declare name: string; }
class TestTemplateDto {
  @IsEmail() to: string;
  @IsOptional() @IsUUID() senderId?: string;
}
class QueryTemplatesDto extends PaginationDto { @IsOptional() @IsString() category?: string; }

@Controller('templates')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TemplatesController {
  constructor(private svc: TemplatesService) {}

  @Get() findAll(@WorkspaceId() ws: string, @Query() q: QueryTemplatesDto) { return this.svc.findAll(ws, q); }
  @Get(':id') findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Post() @Roles('editor')
  create(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: CreateTemplateDto) {
    return this.svc.create(ws, uid, dto);
  }

  @Patch(':id') @Roles('editor')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTemplateDto) {
    return this.svc.update(ws, id, dto);
  }

  @Post(':id/duplicate') @Roles('editor')
  duplicate(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') uid: string) {
    return this.svc.duplicate(ws, id, uid);
  }

  @Post(':id/test') @Roles('editor')
  test(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TestTemplateDto) {
    return this.svc.sendTest(ws, id, dto.to, dto.senderId);
  }

  @Delete(':id') @Roles('editor')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }
}
