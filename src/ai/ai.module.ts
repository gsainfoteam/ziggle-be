import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { UserModule } from 'src/user/user.module';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [ConfigModule, UserModule, LoggerModule],
  providers: [AiService],
  exports: [AiService],
  controllers: [AiController],
})
export class AiModule {}
