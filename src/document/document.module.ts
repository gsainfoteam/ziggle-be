import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { FileModule } from 'src/file/file.module';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [FileModule, LoggerModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
