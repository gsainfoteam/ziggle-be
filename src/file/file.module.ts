import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { CustomConfigModule } from 'src/config/customConfig.module';

@Module({
  imports: [CustomConfigModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
