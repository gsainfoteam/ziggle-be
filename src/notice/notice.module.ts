import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { UserModule } from 'src/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ImageModule } from 'src/image/image.module';
import { FcmModule } from 'src/global/service/fcm.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ConfigModule, UserModule, ImageModule, FcmModule, PrismaModule],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
