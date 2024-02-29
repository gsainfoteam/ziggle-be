import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HttpModule } from '@nestjs/axios';
import { IdpModule } from 'src/idp/idp.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserRepository } from './user.repository';
import { IdPGuard, IdPOptionalGuard } from './guard/id.guard';
import { IdPStrategy } from './guard/idp.strategy';
import { AnonymousStrategy } from './guard/anonymous.strategy';

@Module({
  imports: [HttpModule, IdpModule, ConfigModule, PrismaModule],
  providers: [
    UserService,
    UserRepository,
    IdPGuard,
    IdPOptionalGuard,
    IdPStrategy,
    IdPOptionalGuard,
    AnonymousStrategy,
  ],
  controllers: [UserController],
  exports: [UserService, IdPOptionalGuard, IdPGuard],
})
export class UserModule {}
