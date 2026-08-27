import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { AuthModule } from '../auth/auth.module';
import { IdPStrategy } from './guard/idp.strategy';
import { IdPOptionalStrategy } from './guard/idpOptional.strategy';
import { InfoteamIdpModule } from '@lib/infoteam-idp';

@Module({
  imports: [PrismaModule, LoggerModule, AuthModule, InfoteamIdpModule],
  providers: [UserService, UserRepository, IdPStrategy, IdPOptionalStrategy],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
