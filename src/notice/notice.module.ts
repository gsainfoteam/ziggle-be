import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeController } from './notice.controller';
import { NoticeRepository } from './notice.repository';
import { NoticeService } from './notice.service';
import { UserModule } from 'src/user/user.module';
import { TagModule } from 'src/tag/tag.module';
import { Notice } from 'src/global/entity/notice.entity';
import { ConfigModule } from '@nestjs/config';
import { ImageModule } from 'src/image/image.module';
import { FcmModule } from 'src/global/service/fcm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice]),
    ConfigModule,
    UserModule,
    TagModule,
    ImageModule,
    FcmModule,
    ConfigModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeRepository, NoticeService],
})
export class NoticeModule {}
