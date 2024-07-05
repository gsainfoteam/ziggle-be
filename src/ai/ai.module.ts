import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
