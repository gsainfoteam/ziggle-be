import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { Loggable } from '@lib/logger/decorator/loggable';
import { User } from '@generated/prisma/client';
import { type UserInfo } from '@gsainfoteam/account-nest';
import { Trace } from '../otel/trace.decorator';

@Injectable()
@Loggable()
@Trace()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly authRepository: AuthRepository) {}

  // IdP omits claims without a value: a missing picture clears the stored one, a missing email keeps it (same as the old userinfo login)
  async linkIdpUser({
    sub,
    name,
    email,
    picture,
  }: UserInfo<'name'>): Promise<User> {
    return await this.authRepository.findUserOrCreate({
      uuid: sub,
      name,
      email,
      picture: picture ?? null,
    });
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return await this.authRepository.findUserByUuid(uuid);
  }
}
