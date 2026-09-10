import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
  @IsString() @MinLength(1) firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() workspaceName?: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class RefreshDto {
  @IsOptional() @IsString() refreshToken?: string;
}

export class ForgotPasswordDto { @IsEmail() email: string; }

export class ResetPasswordDto {
  @IsString() token: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
}

export class VerifyEmailDto { @IsString() token: string; }

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) @MaxLength(72) newPassword: string;
}
