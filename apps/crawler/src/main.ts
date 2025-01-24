import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';
import {
  concatMap,
  firstValueFrom,
  identity,
  map,
  take,
  timeout,
  toArray,
} from 'rxjs';
import { CrawlerService } from './crawler.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Crawler');
  const app = await NestFactory.createApplicationContext(CrawlerModule, {
    logger: ['error', 'log'],
  });

  // Crawl notices
  const list = await firstValueFrom(
    app
      .get(CrawlerService)
      .getNoticeList()
      .pipe(
        take(100),
        timeout(60e3),
        concatMap((meta) =>
          app
            .get(CrawlerService)
            .getNoticeDetail(meta.link)
            .pipe(map((notice) => ({ notice, meta }))),
        ),
        map(async (notice) => ({
          prev: await app.get(CrawlerService).checkCrawlData(notice.meta.link),
          notice: notice,
        })),
        concatMap(identity),
        toArray(),
      ),
  );
  logger.log(`Crawled ${list.length} notices`);

  // Split new and existing notices
  const existingNotices = list.filter(({ prev }) => {
    return prev?.id !== undefined;
  });
  const newNotices = list.filter(({ prev }) => {
    return prev?.id === undefined;
  });
  logger.log(`New notices: ${newNotices.length}`);
  logger.log(`Existing notices: ${existingNotices.length}`);

  // Create new notices
  await Promise.all(
    newNotices.map(async ({ notice }) => {
      if (notice.notice.content == undefined) {
        logger.debug(`Notice ${notice.meta.title} has no content`);
        return;
      }
      logger.log(`Creating notice ${notice.meta.title}`);
      await app.get(CrawlerService).createCrawl(
        {
          title: notice.meta.title,
          body: notice.notice.content ?? '',
          type: 'ACADEMIC',
          url: notice.meta.link,
          crawledAt: new Date(),
        },
        new Date(notice.meta.createdAt),
        notice.meta.author,
      );
    }),
  );

  // Update notices
  await Promise.all(
    existingNotices.map(async ({ notice, prev }) => {
      if (notice.notice.content == undefined) {
        logger.debug(`Notice ${notice.meta.title} has no content`);
        return;
      }
      if (!prev) {
        logger.debug(`Notice ${notice.meta.title} has no previous data`);
        return;
      }
      if (prev.title === notice.meta.title) {
        logger.debug(`Notice ${notice.meta.title} has no change`);
        return;
      }
      logger.log(`Updating notice ${notice.meta.title}`);
      await app.get(CrawlerService).updateCrawl(
        {
          title: notice.meta.title,
          body: notice.notice.content ?? '',
          type: 'ACADEMIC',
        },
        prev?.id,
      );
    }),
  );
}
bootstrap();
