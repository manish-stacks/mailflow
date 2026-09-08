import { Module } from '@nestjs/common';
import { ContactsModule } from '@/modules/contacts/contacts.module';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

@Module({ imports: [ContactsModule], controllers: [ListsController], providers: [ListsService], exports: [ListsService] })
export class ListsModule {}
