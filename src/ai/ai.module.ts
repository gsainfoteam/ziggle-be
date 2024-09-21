import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule, UserService],
  providers: [AiService],
  exports: [AiService],
  controllers: [AiController],
})
export class AiModule {}
