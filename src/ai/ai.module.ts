import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigService],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
