import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { SuppressionService } from './suppression.service';

class AddSuppressionDto {
  @IsArray() @ArrayMaxSize(1000) @IsEmail({}, { each: true }) emails: string[];
  @IsOptional() @IsIn(['unsubscribe', 'hard_bounce', 'complaint', 'manual']) reason?: string;
}
class QuerySuppressionsDto extends PaginationDto { @IsOptional() @IsString() reason?: string; }

@Controller('suppressions')
@UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
export class SuppressionController {
  constructor(private svc: SuppressionService) {}

  @Get() findAll(@WorkspaceId() ws: string, @Query() q: QuerySuppressionsDto) { return this.svc.findAll(ws, q); }

  @Post() @Roles('admin')
  add(@WorkspaceId() ws: string, @Body() dto: AddSuppressionDto) { return this.svc.add(ws, dto.emails, dto.reason); }

  @Delete(':id') @Roles('admin')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }
}
