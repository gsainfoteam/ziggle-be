import { Module } from '@nestjs/common';
import { redisSessionStore } from '@gsainfoteam/account-nest';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import ms, { StringValue } from 'ms';
import { AnonymousStrategy } from './guard/anonymous.strategy';
import { AuthRepository } from './auth.repository';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule, CustomConfigService } from '@lib/custom-config';
import { JwtGuard, JwtOptionalGuard } from './guard/jwt.guard';
import { JwtOptionalStrategy } from './guard/jwtOptional.strategy';
import { JwtStrategy } from './guard/jwt.strategy';
import { AuthService } from './auth.service';
import { AdminGuard } from './guard/admin.guard';
import { AccountModule } from './account';

// separate module so AccountModule.forRootAsync can inject AuthService for resolve
@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
class AuthUserModule {}

@Module({
  imports: [
    AuthUserModule,
    AccountModule.forRootAsync({
      imports: [CustomConfigModule, AuthUserModule],
      inject: [CustomConfigService, AuthService, getRedisConnectionToken()],
      useFactory: (
        config: CustomConfigService,
        authService: AuthService,
        redis: Redis,
      ) => ({
        issuer: config.IDP_BASE_URL,
        clientId: config.CLIENT_ID,
        clientSecret: config.CLIENT_SECRET,
        session: {
          secret: config.SESSION_SECRET,
          store: redisSessionStore(redis),
          accessTtl: ms(config.JWT_EXPIRE as StringValue) / 1000,
          refreshTtl: ms(config.REFRESH_TOKEN_EXPIRE as StringValue) / 1000,
          resolve: async (user) => {
            const { uuid } = await authService.linkIdpUser(user);
            return { subject: uuid };
          },
        },
      }),
    }),
  ],
  providers: [
    JwtGuard,
    AdminGuard,
    JwtOptionalGuard,
    JwtStrategy,
    JwtOptionalStrategy,
    AnonymousStrategy,
  ],
  exports: [JwtOptionalGuard, JwtGuard, AdminGuard],
})
export class AuthModule {}
