import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findOrCreateTempUser(name: string): Promise<User> {
    const user = await this.userRepository.findUserByName(name);
    if (user) {
      return user;
    }
    return this.userRepository.createTempUser(name);
  }
}
