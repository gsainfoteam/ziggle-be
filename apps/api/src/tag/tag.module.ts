import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, UserModule, LoggerModule, AuthModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
})
export class TagModule {}
