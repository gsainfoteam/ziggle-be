import { PrismaModule } from '@lib/prisma';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
