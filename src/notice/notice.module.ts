import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NoticeRepository } from './notice.repository';
import { UserModule } from 'src/user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, UserModule, ConfigModule],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
})
export class NoticeModule {}
