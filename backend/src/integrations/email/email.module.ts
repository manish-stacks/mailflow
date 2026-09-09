import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SenderDomain } from '@/database/entities';
import { EmailService } from './email.service';
import { SmtpProvider } from './smtp.provider';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SenderDomain])],
  providers: [SmtpProvider, EmailService],
  exports: [EmailService, SmtpProvider],
})
export class EmailModule {}
