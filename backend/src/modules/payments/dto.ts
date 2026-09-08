import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsString() plan: string; // id or slug
  @IsOptional() @IsIn(['monthly', 'yearly']) billingCycle?: 'monthly' | 'yearly';
}

/** Field names mirror what Razorpay Checkout hands back, minus the snake_case. */
export class VerifyPaymentDto {
  @IsString() @MaxLength(80) razorpayOrderId: string;
  @IsString() @MaxLength(80) razorpayPaymentId: string;
  @IsString() @MaxLength(256) razorpaySignature: string;
}

export class BillingDetailsDto {
  @IsOptional() @IsString() @MaxLength(200) billingName?: string;
  @IsOptional() @IsString() @MaxLength(255) billingEmail?: string;
  @IsOptional() @IsString() @MaxLength(500) billingAddress?: string;
  @IsOptional() @IsString() @MaxLength(20) billingGstin?: string;
}
