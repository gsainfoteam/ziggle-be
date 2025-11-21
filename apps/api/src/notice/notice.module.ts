import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './notice.repository';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';
import { ImageModule } from '../image/image.module';
import { DocumentModule } from '../document/document.module';
import { FileModule } from '../file/file.module';
import { FcmModule } from '../fcm/fcm.module';
import { InfoteamGroupsModule } from '@lib/infoteam-groups/infoteam-groups.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    CustomConfigModule,
    ImageModule,
    DocumentModule,
    FileModule,
    FcmModule,
    LoggerModule,
    InfoteamGroupsModule,
    AuthModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
})
export class NoticeModule {}
