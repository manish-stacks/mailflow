import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

export const CONTACT_STATUSES = ['active', 'unsubscribed', 'bounced', 'complained', 'suppressed'] as const;

export class CreateContactDto {
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsObject() customAttributes?: Record<string, any>;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) listIds?: string[];
}

export class UpdateContactDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsIn(CONTACT_STATUSES as any) status?: string;
  @IsOptional() @IsBoolean() subscribed?: boolean;
  @IsOptional() @IsObject() customAttributes?: Record<string, any>;
}

export class QueryContactsDto extends PaginationDto {
  @IsOptional() @IsIn(CONTACT_STATUSES as any) status?: string;
  @IsOptional() @IsUUID() listId?: string;
  @IsOptional() @IsUUID() segmentId?: string;
}

export class BulkActionDto {
  @IsArray() @ArrayMaxSize(5000) @IsUUID('4', { each: true }) @Type(() => String) contactIds: string[];
  @IsIn(['delete', 'unsubscribe', 'add_to_list', 'remove_from_list']) action: string;
  @IsOptional() @IsUUID() listId?: string;
}
