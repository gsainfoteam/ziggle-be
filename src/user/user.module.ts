import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdpModule } from 'src/idp/idp.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { IdPGuard, IdPOptionalGuard } from './guard/idp.guard';
import { IdPStrategy } from './guard/idp.strategy';
import { IdPOptionalStrategy } from './guard/idpOptional.strategy';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [HttpModule, IdpModule, ConfigModule, PrismaModule],
  providers: [
    UserService,
    UserRepository,
    IdPGuard,
    IdPOptionalGuard,
    IdPStrategy,
    AnonymousStrategy,
    IdPOptionalStrategy,
  ],
  controllers: [UserController],
  exports: [UserService, IdPOptionalGuard, IdPGuard],
})
export class UserModule {}
