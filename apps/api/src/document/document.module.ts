import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { LoggerModule } from '@lib/logger';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule, LoggerModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
