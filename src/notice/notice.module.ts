import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FcmModule } from 'src/global/service/fcm.module';
import { ImageModule } from 'src/image/image.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TagModule } from 'src/tag/tag.module';
import { UserModule } from 'src/user/user.module';
import { NoticeController } from './notice.controller';
import { NoticeRepository } from './notice.repository';
import { NoticeService } from './notice.service';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    ImageModule,
    FcmModule,
    PrismaModule,
    HttpModule,
    TagModule,
    UserModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
})
export class NoticeModule {}
