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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CrawlerModule, {
    logger: ['error'],
  });
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
  const updatedNotices = list.filter(({ prev }) => {
    return prev !== undefined;
  });
  const newNotices = list.filter(({ prev }) => {
    return prev === undefined;
  });

  await Promise.all(
    newNotices.map(async ({ notice }) => {
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

  await Promise.all(
    updatedNotices.map(async ({ notice, prev }) => {
      if (notice.notice.content == undefined) {
        return;
      }
      if (!prev || prev.title === notice.meta.title) {
        return;
      }
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
