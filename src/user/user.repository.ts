import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../global/entity/user.entity';
import { UserInfo } from './type/userInfo.type';
import { FcmToken } from 'src/global/entity/fcmToken.entity';

@Injectable()
export class UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  async createUser(registerUser: UserInfo): Promise<void> {
    this.dataSource.manager.transaction(
      async (entityManager: EntityManager): Promise<void> => {
        const userCreate = new User();
        userCreate.uuid = registerUser.user_uuid;
        userCreate.name = registerUser.user_name;
        userCreate.consent = false;
        await entityManager.save(userCreate);
      },
    );
  }

  async findByUserUUID(userUUID: string): Promise<User> {
    return this.dataSource.manager.findOneBy(User, {
      uuid: userUUID,
    });
  }

  async setFcmToken(userUUID: string, fcmToken: string): Promise<void> {
    this.dataSource.manager.getRepository(FcmToken).upsert(
      {
        token: fcmToken,
        user: { uuid: userUUID ?? null },
        lastCheckedAt: new Date(),
      },
      { conflictPaths: { token: true } },
    );
  }

  async getAllFcmTokens(): Promise<string[]> {
    const tokens = await this.dataSource.manager.getRepository(FcmToken).find();
    return tokens.map((token) => token.token);
  }

  async setConsent(user: User): Promise<void> {
    user.consent = true;
    await this.dataSource.manager.save(user);
  }
}
