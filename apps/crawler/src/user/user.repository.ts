import { PrismaService } from '@lib/prisma';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByName(name: string): Promise<User | null> {
    return this.prismaService.user.findFirst({
      where: { name },
    });
  }

  async createTempUser(name: string): Promise<User> {
    return this.prismaService.user.create({
      data: {
        uuid: uuid(),
        name,
        consent: false,
      },
    });
  }
}
