import { CustomConfigService } from '@lib/custom-config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { dbQueriesTotal, dbQueryDurationSeconds } from '@lib/metrics';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(readonly customConfigService: CustomConfigService) {
    super({
      datasources: {
        db: {
          url: customConfigService.DATABASE_URL,
        },
      },
      log: [{ emit: 'event', level: 'query' }],
    });
  }

  async onModuleInit() {
    this.$on('query', (event: Prisma.QueryEvent) => {
      const operation = this.extractOperation(event.query);
      const model = this.extractModel(event.query);
      const success = 'true';

      dbQueriesTotal.inc({
        operation,
        model,
        success,
      });

      dbQueryDurationSeconds.observe(
        {
          operation,
          model,
          success,
        },
        event.duration / 1000,
      );
    });

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private extractOperation(query: string): string {
    const upper = query.trim().toUpperCase();

    if (upper.startsWith('SELECT')) return 'select';
    if (upper.startsWith('INSERT')) return 'insert';
    if (upper.startsWith('UPDATE')) return 'update';
    if (upper.startsWith('DELETE')) return 'delete';

    return 'other';
  }

  private extractModel(query: string): string {
    const match = query.match(/FROM\s+"?([A-Za-z0-9_]+)"?/i);
    if (match?.[1]) return match[1];

    const insertMatch = query.match(/INTO\s+"?([A-Za-z0-9_]+)"?/i);
    if (insertMatch?.[1]) return insertMatch[1];

    const updateMatch = query.match(/UPDATE\s+"?([A-Za-z0-9_]+)"?/i);
    if (updateMatch?.[1]) return updateMatch[1];

    return 'unknown';
  }
}
