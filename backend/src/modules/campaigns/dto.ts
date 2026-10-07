import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsObject, Max, Min, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested,
} from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class AudienceDto {
  @IsIn(['all', 'lists', 'segments']) mode: 'all' | 'lists' | 'segments';
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) listIds?: string[];
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) segmentIds?: string[];
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) excludeListIds?: string[];
}

export class AbAutoWinnerDto {
  @IsBoolean() enabled: boolean;
  @IsInt() @Min(5) @Max(50) testPercent: number;
  @IsInt() @Min(1) @Max(72) waitHours: number;
  @IsIn(['opens', 'clicks']) metric: 'opens' | 'clicks';
}

export class CampaignSettingsDto {
  @IsOptional() @IsBoolean() trackOpens?: boolean;
  @IsOptional() @IsBoolean() trackClicks?: boolean;
  @IsOptional() @IsBoolean() includeUnsubscribeLink?: boolean;
  @IsOptional() @IsEmail() replyTo?: string;
  /** Optional second subject line — recipients are split 50/50 between subject and subjectB. */
  @IsOptional() @IsString() @MaxLength(255) subjectB?: string;
  @IsOptional() @ValidateNested() @Type(() => AbAutoWinnerDto) abAutoWinner?: AbAutoWinnerDto;
}

export class CreateCampaignDto {
  @IsString() @MinLength(2) @MaxLength(200) name: string;
  @IsOptional() @IsUUID() senderIdentityId?: string;
  @IsOptional() @IsUUID() templateId?: string;
  @IsOptional() @IsString() @MaxLength(255) subject?: string;
  @IsOptional() @IsString() @MaxLength(255) previewText?: string;
  @IsOptional() @IsString() htmlContent?: string;
  @IsOptional() @IsObject() designJson?: any;
  @IsOptional() @ValidateNested() @Type(() => AudienceDto) audience?: AudienceDto;
  @IsOptional() @ValidateNested() @Type(() => CampaignSettingsDto) settings?: CampaignSettingsDto;
}

export class UpdateCampaignDto extends CreateCampaignDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) declare name: string;
}

export class QueryCampaignsDto extends PaginationDto {
  @IsOptional() @IsIn(['draft', 'scheduled', 'preparing', 'sending', 'completed', 'paused', 'cancelled', 'failed'])
  status?: string;
}

export class TestCampaignDto {
  @IsArray() @IsEmail({}, { each: true }) recipients: string[];
}

export class ScheduleCampaignDto {
  @IsDateString() scheduledAt: string;
}
