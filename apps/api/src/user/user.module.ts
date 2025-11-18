import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { PrismaModule } from '@lib/prisma';
import { InfoteamIdpModule } from '@lib/infoteam-idp';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { JwtGuard, JwtOptionalGuard } from './guard/jwt.guard';
import { JwtOptionalStrategy } from './guard/jwtOptional.strategy';
import { JwtStrategy } from './guard/jwt.strategy';

@Module({
  imports: [
    HttpModule,
    CustomConfigModule,
    PrismaModule,
    InfoteamIdpModule,
    LoggerModule,
  ],
  providers: [
    UserService,
    UserRepository,
    JwtGuard,
    JwtOptionalGuard,
    JwtStrategy,
    AnonymousStrategy,
    JwtOptionalStrategy,
  ],
  controllers: [UserController],
  exports: [UserService, JwtOptionalGuard, JwtGuard],
})
export class UserModule {}
