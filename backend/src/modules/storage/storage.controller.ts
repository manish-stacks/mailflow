import { Controller, Get, Param, Post, Query, Res, UploadedFile as File, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser, Public, Roles, WorkspaceId } from '@/common/decorators';
import { ApiKeyAuthGuard } from '@/common/guards/api-key.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { StorageService } from './storage.service';

const ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'text/csv', 'application/vnd.ms-excel'];

@Controller()
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('files/upload')
  @UseGuards(ApiKeyAuthGuard, WorkspaceGuard) @Roles('editor')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(
    @WorkspaceId() ws: string,
    @CurrentUser('id') userId: string,
    @File() file: Express.Multer.File,
    @Query('purpose') purpose = 'image',
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');
    return this.storage.upload({
      workspaceId: ws, userId, buffer: file.buffer,
      fileName: file.originalname, mimeType: file.mimetype, purpose,
    });
  }

  @Get('files')
  @UseGuards(ApiKeyAuthGuard, WorkspaceGuard)
  list(@WorkspaceId() ws: string, @Query('purpose') purpose?: string) { return this.storage.list(ws, purpose); }

  /** Local-disk fallback serving. With S3 configured, assets are served by the bucket/CDN. */
  @Public() @Get('storage/*')
  async serve(@Param() params: any, @Res() res: Response) {
    const key = params['0'];
    const buf = await this.storage.download(key);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buf);
  }
}
