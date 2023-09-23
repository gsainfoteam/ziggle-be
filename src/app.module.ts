import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { NoticeModule } from './notice/notice.module';
import { TagModule } from './tag/tag.module';
import { AppController } from './app.controller';
import { ImageModule } from './image/image.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? 'prod.env' : 'dev.env',
    }),
    UserModule,
    NoticeModule,
    TagModule,
    ImageModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
})
export class AppModule {}
