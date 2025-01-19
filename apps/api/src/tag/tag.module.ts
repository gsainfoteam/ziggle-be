import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, UserModule, LoggerModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
})
export class TagModule {}
