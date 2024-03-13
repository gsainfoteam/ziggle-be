import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NoticeRepository } from './notice.repository';
import { UserModule } from 'src/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { NoticeMapper } from './notice.mapper';
import { ImageModule } from 'src/image/image.module';
import { DocumentModule } from 'src/document/document.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ConfigModule,
    ImageModule,
    DocumentModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository, NoticeMapper],
})
export class NoticeModule {}
