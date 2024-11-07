import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CrawlRepository } from './crawl.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { AiModule } from 'src/ai/ai.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    UserModule,
    AiModule,
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
  providers: [CrawlService, CrawlRepository],
  controllers: [CrawlController],
})
export class CrawlModule {}
