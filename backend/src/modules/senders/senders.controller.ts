import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Public, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { SendersService } from './senders.service';

class CreateSenderDto {
  @IsString() @MaxLength(150) fromName: string;
  @IsEmail() fromEmail: string;
  @IsOptional() @IsEmail() replyToEmail?: string;
}
class UpdateSenderDto {
  @IsOptional() @IsString() @MaxLength(150) fromName?: string;
  @IsOptional() @IsEmail() replyToEmail?: string;
}

@Controller()
export class SendersController {
  constructor(private svc: SendersService) {}

  @Public() @Get('senders/verify')
  verify(@Query('token') token: string) { return this.svc.verify(token); }

  @Get('senders') @UseGuards(JwtAuthGuard, WorkspaceGuard)
  findAll(@WorkspaceId() ws: string) { return this.svc.findAll(ws); }

  @Post('senders') @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  create(@WorkspaceId() ws: string, @Body() dto: CreateSenderDto) { return this.svc.create(ws, dto); }

  @Patch('senders/:id') @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  update(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSenderDto) {
    return this.svc.update(ws, id, dto);
  }

  @Delete('senders/:id') @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  remove(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(ws, id); }

  @Post('senders/:id/resend') @UseGuards(JwtAuthGuard, WorkspaceGuard) @Roles('admin')
  resend(@WorkspaceId() ws: string, @Param('id', ParseUUIDPipe) id: string) { return this.svc.resend(ws, id); }
}
