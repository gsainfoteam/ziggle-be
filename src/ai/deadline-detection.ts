import { JSONOutput } from '@aws-sdk/client-s3';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface DeadlineResponse extends JSONOutput {
  deadline: string;
}

@Injectable()
export class DeadlineDetectionService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async detectDeadline(body: string, createdAt: Date): Promise<Date | null> {
    const url =
      this.configService.getOrThrow<string>('AI_API_URL') +
      '/deadline_detection';
    const data = {
      body: body,
      createdAt: createdAt,
    };
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await firstValueFrom(
      this.httpService.post<DeadlineResponse>(url, data, config),
    );

    if (response.data.deadline == '') {
      return null;
    }
    return new Date(response.data.deadline.split(' ').join('T') + '.000Z');
  }
}
