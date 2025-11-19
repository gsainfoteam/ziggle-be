import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { PrismaModule } from '@lib/prisma';
import { InfoteamIdpModule } from '@lib/infoteam-idp';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule, CustomConfigService } from '@lib/custom-config';
import { JwtGuard, JwtOptionalGuard } from './guard/jwt.guard';
import { JwtOptionalStrategy } from './guard/jwtOptional.strategy';
import { JwtStrategy } from './guard/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'libs/redis/src';
import ms, { StringValue } from 'ms';

@Module({
  imports: [
    HttpModule,
    CustomConfigModule,
    PrismaModule,
    InfoteamIdpModule,
    LoggerModule,
    JwtModule.registerAsync({
      imports: [CustomConfigModule],
      inject: [CustomConfigService],
      useFactory: (customConfigService: CustomConfigService) => ({
        secret: customConfigService.JWT_SECRET,
        signOptions: {
          expiresIn: ms(customConfigService.JWT_EXPIRE as StringValue),
          algorithm: 'HS256',
          audience: customConfigService.JWT_AUDIENCE,
          issuer: customConfigService.JWT_ISSUER,
        },
      }),
    }),
    RedisModule,
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
