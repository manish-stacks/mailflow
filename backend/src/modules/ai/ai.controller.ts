import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { AiService } from './ai.service';
import { REWRITE_ACTIONS, RewriteAction } from './prompts';

class GenerateEmailDto {
  @IsString() @MinLength(2) @MaxLength(200) product: string;
  @IsString() @MaxLength(200) audience: string;
  @IsString() @MaxLength(200) goal: string;
  @IsString() @MaxLength(80) tone: string;
  @IsOptional() @IsString() @MaxLength(1500) keyPoints?: string;
  @IsOptional() @IsString() @MaxLength(300) offer?: string;
  @IsOptional() @IsString() @MaxLength(120) cta?: string;
  @IsOptional() @IsString() @MaxLength(120) brandName?: string;
}
class GenerateSubjectDto {
  @IsString() @MaxLength(500) topic: string;
  @IsOptional() @IsString() @MaxLength(80) tone?: string;
}
class RewriteDto {
  @IsIn(Object.keys(REWRITE_ACTIONS)) action: RewriteAction;
  @IsString() @MinLength(5) @MaxLength(20000) content: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(private ai: AiService) {}

  @Get('usage')
  usage(@WorkspaceId() ws: string) { return this.ai.usageSummary(ws); }

  @Post('generate-email') @Roles('editor')
  generate(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: GenerateEmailDto) {
    return this.ai.generateEmail(ws, uid, dto);
  }

  @Post('generate-subject') @Roles('editor')
  subjects(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: GenerateSubjectDto) {
    return this.ai.generateSubjects(ws, uid, dto.topic, dto.tone);
  }

  @Post('rewrite') @Roles('editor')
  rewrite(@WorkspaceId() ws: string, @CurrentUser('id') uid: string, @Body() dto: RewriteDto) {
    return this.ai.rewrite(ws, uid, dto.action, dto.content);
  }
}
