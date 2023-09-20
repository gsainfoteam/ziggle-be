import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { HttpModule } from '@nestjs/axios';
import { IdPGuard } from './guard/idp.guard';
import { IdPStrategy } from './guard/idp.strategy';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { IdpOptionalStrategy } from './guard/idpOptional.strategy';

@Module({
  imports: [HttpModule],
  providers: [
    UserService,
    UserRepository,
    IdPGuard,
    IdPStrategy,
    IdpOptionalStrategy,
    AnonymousStrategy,
  ],
  controllers: [UserController],
  exports: [IdPGuard, UserRepository],
})
export class UserModule {}
