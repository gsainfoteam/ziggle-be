import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { MoService } from './idp/mo/mo.service';
import { IdpModule } from './idp/idp.module';

@Module({
  imports: [FileModule, UserModule, IdpModule],
  controllers: [AppController],
  providers: [MoService],
})
export class AppModule {}
