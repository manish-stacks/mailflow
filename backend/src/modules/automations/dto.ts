import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Max, Min, MinLength, ArrayMaxSize, ValidateNested } from 'class-validator';

export class AutomationStepDto {
  @IsInt() @Min(0) @Max(60 * 24 * 365) delayMinutes: number;
  @IsString() @MinLength(1) @MaxLength(255) subject: string;
  @IsOptional() @IsString() @MaxLength(255) previewText?: string;
  @IsOptional() @IsString() htmlContent?: string;
}

export class SaveAutomationDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) name?: string;
  @IsOptional() @IsIn(['list_join', 'contact_created']) triggerType?: 'list_join' | 'contact_created';
  @IsOptional() @IsUUID() listId?: string | null;
  @IsOptional() @IsUUID() senderIdentityId?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => AutomationStepDto)
  steps?: AutomationStepDto[];
}
