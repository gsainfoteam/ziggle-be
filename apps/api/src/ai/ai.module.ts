import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [CustomConfigModule, UserModule, LoggerModule],
  providers: [AiService],
  exports: [AiService],
  controllers: [AiController],
})
export class AiModule {}
