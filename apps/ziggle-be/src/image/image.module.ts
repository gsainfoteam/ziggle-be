import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { FileModule } from 'src/file/file.module';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [FileModule, LoggerModule],
  providers: [ImageService],
  controllers: [ImageController],
  exports: [ImageService],
})
export class ImageModule {}
