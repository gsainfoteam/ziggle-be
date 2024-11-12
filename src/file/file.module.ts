import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [CustomConfigModule, LoggerModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
