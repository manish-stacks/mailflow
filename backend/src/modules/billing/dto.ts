import {
  IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';

/** -1 is the sentinel for unlimited, so Min(-1) rather than Min(0). */
export class PlanDto {
  @IsString() @MaxLength(100) name: string;
  @IsString() @MaxLength(60) slug: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsNumber() @Min(0) priceMonthly?: number;
  @IsOptional() @IsNumber() @Min(0) priceYearly?: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;

  @IsOptional() @IsInt() @Min(-1) maxContacts?: number;
  @IsOptional() @IsInt() @Min(-1) maxEmailsPerMonth?: number;
  @IsOptional() @IsInt() @Min(-1) maxCampaignsPerMonth?: number;
  @IsOptional() @IsInt() @Min(-1) maxTeamMembers?: number;
  @IsOptional() @IsInt() @Min(-1) maxSenderIdentities?: number;
  @IsOptional() @IsInt() @Min(-1) maxDomains?: number;
  @IsOptional() @IsInt() @Min(-1) aiCreditsPerDay?: number;

  @IsOptional() @IsBoolean() allowCustomSmtp?: boolean;
  @IsOptional() @IsBoolean() allowApiAccess?: boolean;
  @IsOptional() @IsBoolean() allowAi?: boolean;
  @IsOptional() @IsBoolean() allowSegments?: boolean;
  @IsOptional() @IsBoolean() removeBranding?: boolean;

  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdatePlanDto extends PlanDto {
  @IsOptional() @IsString() @MaxLength(100) declare name: string;
  @IsOptional() @IsString() @MaxLength(60) declare slug: string;
}

export class AssignPlanDto {
  @IsString() plan: string; // id or slug
  @IsOptional() @IsIn(['monthly', 'yearly', 'lifetime', 'free']) billingCycle?: 'monthly' | 'yearly' | 'lifetime' | 'free';
  @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @IsOptional() @IsObject() overrides?: Record<string, any>;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class SetStatusDto {
  @IsIn(['trialing', 'active', 'past_due', 'cancelled', 'suspended']) status: any;
}
