import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { DomainsService } from './domains.service';

class CreateDomainDto { @IsString() domain: string; }

@Controller('domains')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DomainsController {
  constructor(private svc: DomainsService) {}

  @Get() findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }
  @Get(':id') findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Post() @Roles('admin')
  create(@WorkspaceId() ws: string, @Body() dto: CreateDomainDto) { return this.svc.create(ws, dto.domain); }

  @Post(':id/verify') @Roles('admin')
  verify(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.verify(ws, id); }

  @Delete(':id') @Roles('admin')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }
}
