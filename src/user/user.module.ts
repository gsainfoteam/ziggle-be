import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { IdPGuard } from './guard/idp.guard';
import { IdPStrategy } from './guard/idp.strategy';
import { IdpOptionalStrategy } from './guard/idpOptional.strategy';
import { UserController } from './user.controller';
import { UserService } from './user.service';

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
  exports: [IdPGuard, UserService],
})
export class UserModule {}
