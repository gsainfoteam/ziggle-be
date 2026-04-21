import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Prisma } from '@prisma/client';
import { dbQueriesTotal, dbQueryDurationSeconds } from '@lib/metrics';

@Injectable()
export class PrismaMetricsService implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) {}

  onModuleInit() {
    this.prismaService.$on('query', (event: Prisma.QueryEvent) => {
      const operation = this.extractOperation(event.query);
      const model = this.extractModel(event.query);

      dbQueriesTotal.add(1, {
        operation,
        model,
      });

      dbQueryDurationSeconds.record(event.duration / 1000, {
        operation,
        model,
      });
    });
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
    const tableMatch = query.match(
      /(?:FROM|INTO|UPDATE)\s+(?:(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)\s*\.\s*)?(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/i,
    );
    const model = tableMatch?.[1] ?? tableMatch?.[2];
    if (model) return model;

    return 'unknown';
  }
}
