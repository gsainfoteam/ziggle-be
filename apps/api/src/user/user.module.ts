import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { AuthModule } from '../auth/auth.module';
import { InfoteamIdpModule } from '@lib/infoteam-idp';

@Module({
  imports: [PrismaModule, LoggerModule, AuthModule, InfoteamIdpModule],
  providers: [UserService, UserRepository],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
