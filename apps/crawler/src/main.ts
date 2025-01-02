import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule);
  await app.listen(3000);
}
bootstrap();
