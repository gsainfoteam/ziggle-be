import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { LoggerModule } from '@lib/logger';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule, LoggerModule],
  providers: [ImageService],
  controllers: [ImageController],
  exports: [ImageService],
})
export class ImageModule {}
