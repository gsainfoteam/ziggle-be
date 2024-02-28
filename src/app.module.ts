import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { IdpModule } from './idp/idp.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [FileModule, UserModule, IdpModule, TagModule],
  controllers: [AppController],
})
export class AppModule {}
