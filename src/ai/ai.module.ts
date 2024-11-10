import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { UserModule } from 'src/user/user.module';
import { CustomConfigModule } from 'src/config/customConfig.module';

@Module({
  imports: [CustomConfigModule, UserModule],
  providers: [AiService],
  exports: [AiService],
  controllers: [AiController],
})
export class AiModule {}
