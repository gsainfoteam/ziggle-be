import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './notice.repository';
import { UserModule } from 'src/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoticeMapper } from './notice.mapper';
import { ImageModule } from 'src/image/image.module';
import { DocumentModule } from 'src/document/document.module';
import { FileModule } from 'src/file/file.module';
import { GroupModule } from 'src/group/group.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ConfigModule,
    ImageModule,
    DocumentModule,
    FileModule,
    GroupModule,
    FcmModule,
    LoggerModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.getOrThrow<string>('REDIS_HOST'),
            port: configService.getOrThrow<number>('REDIS_PORT'),
          },
          ttl: 3 * 60,
        });

        return {
          store: store as unknown as CacheStore,
        };
      },
    }),
  ],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository, NoticeMapper],
})
export class NoticeModule {}
