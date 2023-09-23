import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpModule } from '@nestjs/axios';
import { IdPGuard } from './guard/idp.guard';
import { IdPStrategy } from './guard/idp.strategy';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { IdpOptionalStrategy } from './guard/idpOptional.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [
    UserService,
    IdPGuard,
    IdPStrategy,
    IdpOptionalStrategy,
    AnonymousStrategy,
  ],
  controllers: [UserController],
  exports: [IdPGuard],
})
export class UserModule {}
