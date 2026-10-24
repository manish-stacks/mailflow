import { Transform } from 'class-transformer';
import {
  ArrayMaxSize, Equals, IsArray, IsBoolean, IsEmail, IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { DEMO_STATUSES } from '@/database/entities';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toArray = ({ value }: { value: unknown }) => (Array.isArray(value) ? value : value ? [value] : []);

/** Payload posted by the landing page DemoForm. Field names match the form exactly. */
export class CreateDemoRequestDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(150)
  name: string;

  @Transform(trim) @IsEmail() @MaxLength(255)
  email: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(200)
  company?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(30)
  teamSize?: string;

  @IsOptional() @Transform(toArray) @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(60, { each: true })
  interests?: string[];

  @IsOptional() @Transform(trim) @IsString() @MaxLength(600)
  message?: string;

  @IsBoolean() @Equals(true, { message: 'Consent is required' })
  consent: boolean;

  @IsOptional() @IsString() @MaxLength(60)
  source?: string;

  @IsOptional() @IsISO8601()
  requestedAt?: string;

  /** Honeypot — real users never see or fill this. */
  @IsOptional() @IsString() @MaxLength(200)
  website?: string;
}

export class QueryDemoRequestsDto extends PaginationDto {
  @IsOptional() @IsIn([...DEMO_STATUSES])
  status?: string;
}

export class UpdateDemoRequestDto {
  @IsOptional() @IsIn([...DEMO_STATUSES])
  status?: (typeof DEMO_STATUSES)[number];

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
