import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmtpProvider } from './smtp.provider';

@Global()
@Module({ providers: [SmtpProvider, EmailService], exports: [EmailService, SmtpProvider] })
export class EmailModule {}
