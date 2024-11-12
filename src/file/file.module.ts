import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { CustomConfigModule } from 'src/config/customConfig.module';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [CustomConfigModule, LoggerModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
