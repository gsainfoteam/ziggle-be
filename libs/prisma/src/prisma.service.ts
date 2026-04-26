import { CustomConfigService } from '@lib/custom-config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(readonly customConfigService: CustomConfigService) {
    const adapter = new PrismaPg({
      connectionString: customConfigService.DATABASE_URL,
    });

    super({
      adapter,
      log: [{ emit: 'event', level: 'query' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  onQuery(callback: (event: Prisma.QueryEvent) => void): void {
    const eventClient = this as unknown as {
      $on(
        eventType: 'query',
        callback: (event: Prisma.QueryEvent) => void,
      ): void;
    };
    eventClient.$on('query', callback);
  }

}
