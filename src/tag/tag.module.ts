import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { RedisCacheModule } from '@lib/redis-cache';

@Module({
  imports: [PrismaModule, UserModule, LoggerModule, RedisCacheModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
})
export class TagModule {}
