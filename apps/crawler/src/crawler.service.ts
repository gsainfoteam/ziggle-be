import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CrawlerService {
  constructor(private readonly httpService: HttpService) {}
}
