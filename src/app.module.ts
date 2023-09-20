import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySQLConfigModule } from './global/config/database/config.module';
import { MySQLConfigService } from './global/config/database/config.service';
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
    TypeOrmModule.forRootAsync({
      imports: [MySQLConfigModule],
      useClass: MySQLConfigService,
      inject: [MySQLConfigService],
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
