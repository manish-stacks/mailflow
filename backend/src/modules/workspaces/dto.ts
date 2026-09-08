import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsOptional() @IsString() timezone?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() timezone?: string;
}

export class InviteMemberDto {
  @IsString() email: string;
  @IsIn(['admin', 'editor', 'viewer']) role: 'admin' | 'editor' | 'viewer';
}

export class UpdateMemberDto {
  @IsIn(['admin', 'editor', 'viewer']) role: 'admin' | 'editor' | 'viewer';
}

/**
 * Creates the login outright instead of emailing an invite — for agencies that
 * hand over credentials directly. `sendCredentials` mails the password once;
 * the user is flagged to change it on first sign-in either way.
 */
export class CreateMemberLoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(1) @MaxLength(100) firstName: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(72) password?: string;
  @IsIn(['admin', 'editor', 'viewer']) role: 'admin' | 'editor' | 'viewer';
  @IsOptional() @IsBoolean() sendCredentials?: boolean;
}
