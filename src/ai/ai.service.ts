import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DeadlineResponse } from './types/deadlineResponse.type';

@Injectable()
export class AiService {
  private aiUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiUrl = this.configService.getOrThrow<string>('AI_API_URL');
  }

  async detectDeadline(body: string, createdAt: Date): Promise<Date | null> {
    const response = await firstValueFrom(
      this.httpService.post<DeadlineResponse>(
        this.aiUrl + '/deadline_detection',
        { body, createdAt },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    if (response.data.deadline == '') {
      return null;
    }
    return new Date(response.data.deadline.split(' ').join('T') + '.000Z');
  }
}
