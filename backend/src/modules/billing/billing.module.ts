import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contact, Plan, SenderDomain, SenderIdentity, Subscription, UsagePeriod, WorkspaceMember,
} from '@/database/entities';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

/** Global so any module can inject BillingService for a quota check. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Plan, Subscription, UsagePeriod, Contact, WorkspaceMember, SenderIdentity, SenderDomain])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
