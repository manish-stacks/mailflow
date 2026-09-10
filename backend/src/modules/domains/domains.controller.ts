import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { DomainsService } from './domains.service';

class CreateDomainDto {
  @IsString() domain: string;
  // Which mailbox provider this domain's actual email hosting uses (not necessarily
  // Hostinger) — lets us merge the right SPF include so it doesn't conflict with
  // whatever the client already has configured there.
  @IsOptional() @IsIn(['hostinger', 'google', 'microsoft', 'zoho', 'godaddy', 'custom', 'none'])
  mailboxProvider?: string;
  @IsOptional() @IsString() customSpfInclude?: string;
}

@Controller('domains')
@UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
export class DomainsController {
  constructor(private svc: DomainsService) {}

  @Get() findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }
  @Get(':id') findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Post() @Roles('admin')
  create(@WorkspaceId() ws: string, @Body() dto: CreateDomainDto) {
    return this.svc.create(ws, dto.domain);
  }

  @Post(':id/verify') @Roles('admin')
  verify(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.verify(ws, id); }

  @Delete(':id') @Roles('admin')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }
}
