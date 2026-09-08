import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { BulkActionDto, CreateContactDto, QueryContactsDto, UpdateContactDto } from './dto';
import { ContactsService } from './contacts.service';

@Controller('contacts')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ContactsController {
  constructor(private svc: ContactsService) {}

  @Get()
  findAll(@WorkspaceId() ws: string, @Query() q: QueryContactsDto) { return this.svc.findAll(ws, q); }

  @Get('stats')
  stats(@WorkspaceId() ws: string) { return this.svc.stats(ws); }

  @Get(':id')
  findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Get(':id/activity')
  activity(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.activity(ws, id); }

  @Post() @Roles('editor')
  create(@WorkspaceId() ws: string, @Body() dto: CreateContactDto) { return this.svc.create(ws, dto); }

  @Patch(':id') @Roles('editor')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContactDto) {
    return this.svc.update(ws, id, dto);
  }

  @Delete(':id') @Roles('editor')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }

  @Post('bulk') @Roles('editor')
  bulk(@WorkspaceId() ws: string, @Body() dto: BulkActionDto) { return this.svc.bulk(ws, dto); }
}
