import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [PrismaModule, UserModule, LoggerModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
})
export class TagModule {}
