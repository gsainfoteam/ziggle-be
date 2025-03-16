import {
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueRemoved,
  Process,
  Processor,
} from '@nestjs/bull';
import { FcmService } from './fcm.service';
import { QueueDataType } from './types/queue.type';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

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

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error}`);
    this.logger.error(job.data);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnQueueRemoved()
  onRemoved(jobId: string) {
    this.logger.debug(`Job ${jobId} removed`);
  }
}
