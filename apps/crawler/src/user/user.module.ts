import { PrismaModule } from '@lib/prisma';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
