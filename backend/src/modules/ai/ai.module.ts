import { Module } from '@nestjs/common';
import { HuggingFaceProvider } from '@/integrations/huggingface/huggingface.provider';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({ controllers: [AiController], providers: [AiService, HuggingFaceProvider], exports: [AiService] })
export class AiModule {}
