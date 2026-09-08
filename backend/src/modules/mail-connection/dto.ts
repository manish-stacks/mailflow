import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const MAIL_PROVIDERS = ['smtp', 'gmail', 'outlook', 'ses', 'brevo', 'sendgrid', 'mailgun'] as const;

export class SaveConnectionDto {
  @IsOptional() @IsString() @MaxLength(120) label?: string;
  @IsOptional() @IsIn(MAIL_PROVIDERS as any) provider?: string;
  @IsOptional() @IsString() @MaxLength(255) host?: string;
  @IsOptional() @IsInt() @Min(1) @Max(65535) port?: number;
  @IsOptional() @IsBoolean() secure?: boolean;
  @IsOptional() @IsString() @MaxLength(255) username?: string;
  /** Omit on update to keep the stored password. */
  @IsOptional() @IsString() @MaxLength(500) password?: string;
  @IsOptional() @IsString() @MaxLength(150) fromName?: string;
  @IsOptional() @IsEmail() fromEmail?: string;
  @IsOptional() @IsInt() @Min(0) dailyLimit?: number;
  @IsOptional() @IsInt() @Min(0) ratePerMinute?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class TestConnectionDto {
  @IsOptional() @IsEmail() sendTo?: string;
}
