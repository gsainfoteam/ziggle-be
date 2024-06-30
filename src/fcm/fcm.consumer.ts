import { Process, Processor } from '@nestjs/bull';
import { FcmService } from './fcm.service';
import { QueueDataType } from './types/queue.type';
import { Logger } from '@nestjs/common';

@Processor('fcm')
export class FcmConsumer {
  private readonly logger = new Logger(FcmConsumer.name);
  constructor(private readonly fcmService: FcmService) {}

  @Process()
  async handleFcmMessage(job: { data: QueueDataType }): Promise<void> {
    this.logger.debug('Start processing fcm message');
    const { targetUser, notification, data } = job.data;
    await this.fcmService.postMessage(notification, targetUser, data);
  }
}
