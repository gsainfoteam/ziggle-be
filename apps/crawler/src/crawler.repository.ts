import { PrismaService } from '@lib/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CrawlerRepository {
  constructor(private readonly prismaService: PrismaService) {}
}
