import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { IdpModule } from './idp/idp.module';
import { TagModule } from './tag/tag.module';
import { NoticeModule } from './notice/notice.module';
import { DocumentModule } from './document/document.module';
import { ImageModule } from './image/image.module';
import { CrawlModule } from './crawl/crawl.module';

@Module({
  imports: [
    FileModule,
    UserModule,
    IdpModule,
    TagModule,
    NoticeModule,
    DocumentModule,
    ImageModule,
    CrawlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
