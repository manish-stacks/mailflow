import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsObject, IsOptional, IsUUID } from 'class-validator';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { StorageService } from '@/modules/storage/storage.service';
import { ImportService } from './import.service';

class StartImportDto {
  @IsUUID() fileId: string;
  @IsOptional() @IsUUID() listId?: string;
  @IsObject() mapping: Record<string, string>;
}

@Controller('contacts/import')
@UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
export class ImportController {
  constructor(private svc: ImportService, private storage: StorageService) {}

  /** Upload + parse in one call: stores the CSV and returns headers/sample for mapping. */
  @Post('upload') @Roles('editor')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(@WorkspaceId() ws: string, @CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!/\.csv$/i.test(file.originalname)) throw new BadRequestException('Only .csv files are supported');
    const preview = await this.svc.preview(file.buffer);
    const stored = await this.storage.upload({
      workspaceId: ws, userId, buffer: file.buffer,
      fileName: file.originalname, mimeType: 'text/csv', purpose: 'csv',
    });
    return { fileId: stored.id, fileName: stored.fileName, ...preview };
  }

  @Post() @Roles('editor')
  start(@WorkspaceId() ws: string, @CurrentUser('id') userId: string, @Body() dto: StartImportDto) {
    return this.svc.start(ws, userId, dto);
  }

  @Get() list(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }

  @Get(':id') status(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(ws, id); }
}
