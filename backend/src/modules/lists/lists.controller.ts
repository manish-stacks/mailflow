import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { QueryContactsDto } from '@/modules/contacts/dto';
import { ContactsService } from '@/modules/contacts/contacts.service';
import { ListsService } from './lists.service';

class CreateListDto {
  @IsString() @MaxLength(150) name: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
class UpdateListDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
class ListContactsDto {
  @IsArray() @ArrayMaxSize(5000) @IsUUID('4', { each: true }) contactIds: string[];
}

@Controller('lists')
@UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
export class ListsController {
  constructor(private svc: ListsService, private contacts: ContactsService) {}

  @Get() findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }

  @Get(':id') findOne(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }

  @Get(':id/contacts')
  members(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Query() q: QueryContactsDto) {
    return this.contacts.findAll(ws, { ...q, listId: id });
  }

  @Post() @Roles('editor')
  create(@WorkspaceId() ws: string, @Body() dto: CreateListDto) { return this.svc.create(ws, dto); }

  @Patch(':id') @Roles('editor')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateListDto) {
    return this.svc.update(ws, id, dto);
  }

  @Delete(':id') @Roles('editor')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }

  @Post(':id/contacts') @Roles('editor')
  add(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ListContactsDto) {
    return this.svc.addContacts(ws, id, dto.contactIds);
  }

  @Delete(':id/contacts') @Roles('editor')
  removeContacts(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ListContactsDto) {
    return this.svc.removeContacts(ws, id, dto.contactIds);
  }
}
