import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { ApiKeysService } from './apikeys.service';

class CreateApiKeyDto {
  @IsString() @MaxLength(150) name: string;
  @IsOptional() @IsArray() scopes?: string[];
}

@Controller('api-keys')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ApiKeysController {
  constructor(private svc: ApiKeysService) {}

  @Get() findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }

  @Post() @Roles('admin')
  create(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: CreateApiKeyDto) {
    return this.svc.create(ws, uid, dto.name, dto.scopes);
  }

  @Delete(':id') @Roles('admin')
  revoke(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.revoke(ws, id); }
}
