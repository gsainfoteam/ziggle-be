import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './notice.repository';
import { NoticeMapper } from './notice.mapper';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';
import { ImageModule } from '../image/image.module';
import { DocumentModule } from '../document/document.module';
import { FileModule } from '../file/file.module';
import { GroupModule } from '../group/group.module';
import { FcmModule } from '../fcm/fcm.module';

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
