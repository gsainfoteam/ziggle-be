import { Module } from '@nestjs/common';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { AuthRepository } from './auth.repository';
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
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
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
          expiresIn: ms(customConfigService.JWT_EXPIRE as StringValue) / 1000,
          algorithm: 'HS256',
          audience: customConfigService.JWT_AUDIENCE,
          issuer: customConfigService.JWT_ISSUER,
        },
      }),
    }),
    RedisModule,
  ],
  providers: [
    AuthService,
    AuthRepository,
    JwtGuard,
    JwtOptionalGuard,
    JwtStrategy,
    JwtOptionalStrategy,
    AnonymousStrategy,
  ],
  controllers: [AuthController],
  exports: [JwtOptionalGuard, JwtGuard],
})
export class AuthModule {}
