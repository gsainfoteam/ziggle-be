import { Injectable } from '@nestjs/common';

@Injectable()
export class CrawlerService {
  getHello(): string {
    return 'Hello World!';
  }
}
