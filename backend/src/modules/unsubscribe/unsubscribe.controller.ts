import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Public } from '@/common/decorators';
import { UnsubscribeService } from './unsubscribe.service';

class UnsubscribeDto { @IsOptional() @IsString() @MaxLength(300) reason?: string; }

@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(private svc: UnsubscribeService) {}

  @Public() @Get(':token')
  info(@Param('token') token: string) { return this.svc.info(token); }

  @Public() @Post(':token')
  unsubscribe(@Param('token') token: string, @Body() dto: UnsubscribeDto, @Req() req: Request) {
    return this.svc.unsubscribe(token, dto?.reason, req.ip);
  }

  @Public() @Post(':token/resubscribe')
  resubscribe(@Param('token') token: string) { return this.svc.resubscribe(token); }
}
