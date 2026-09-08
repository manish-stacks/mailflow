import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { MailConnectionService } from './mail-connection.service';
import { SaveConnectionDto, TestConnectionDto } from './dto';

@Controller('mail-connection')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class MailConnectionController {
  constructor(private svc: MailConnectionService) {}

  @Get() find(@WorkspaceId() ws: string) { return this.svc.find(ws); }

  @Get('presets') presets() { return this.svc.presets(); }

  @Put() @Roles('admin')
  save(@WorkspaceId() ws: string, @Body() dto: SaveConnectionDto) { return this.svc.save(ws, dto); }

  @Post('test') @Roles('admin')
  test(@WorkspaceId() ws: string, @Body() dto: TestConnectionDto) { return this.svc.test(ws, dto.sendTo); }

  @Delete() @Roles('admin')
  remove(@WorkspaceId() ws: string) { return this.svc.remove(ws); }
}
