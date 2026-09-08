import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class SegmentRuleDto {
  @IsString() field: string;
  @IsString() operator: any;
  @IsOptional() value?: any;
}

export class CreateSegmentDto {
  @IsString() @MaxLength(150) name: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsIn(['all', 'any']) matchType: 'all' | 'any';
  @IsArray() @ValidateNested({ each: true }) @Type(() => SegmentRuleDto) rules: SegmentRuleDto[];
}

export class UpdateSegmentDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsIn(['all', 'any']) matchType?: 'all' | 'any';
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SegmentRuleDto) rules?: SegmentRuleDto[];
}

export class PreviewSegmentDto {
  @IsIn(['all', 'any']) matchType: 'all' | 'any';
  @IsArray() @ValidateNested({ each: true }) @Type(() => SegmentRuleDto) rules: SegmentRuleDto[];
}
