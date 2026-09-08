import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConnection } from '@/database/entities';
import { MailConnectionController } from './mail-connection.controller';
import { MailConnectionService } from './mail-connection.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EmailConnection])],
  controllers: [MailConnectionController],
  providers: [MailConnectionService],
  exports: [MailConnectionService],
})
export class MailConnectionModule {}
