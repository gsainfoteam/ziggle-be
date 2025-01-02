import { CustomConfigService } from '@lib/custom-config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(readonly customConfigService: CustomConfigService) {
    console.log(customConfigService.DATABASE_URL);
    super({
      datasources: {
        db: {
          url: customConfigService.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    // console.log('connected');
    this.notice.count().then(console.log);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
