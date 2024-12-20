import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './notice.repository';
import { UserModule } from 'src/user/user.module';
import { NoticeMapper } from './notice.mapper';
import { ImageModule } from 'src/image/image.module';
import { DocumentModule } from 'src/document/document.module';
import { FileModule } from 'src/file/file.module';
import { GroupModule } from 'src/group/group.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    CustomConfigModule,
    ImageModule,
    DocumentModule,
    FileModule,
    GroupModule,
    FcmModule,
    LoggerModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository, NoticeMapper],
})
export class NoticeModule {}
