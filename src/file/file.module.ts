import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
