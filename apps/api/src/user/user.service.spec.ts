import { mock, MockProxy } from 'jest-mock-extended';
import { User } from '@generated/prisma/client';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockProxy<UserRepository>;

  beforeEach(() => {
    userRepository = mock<UserRepository>();
    service = new UserService(userRepository, mock<InfoteamIdpService>());
  });

  describe('findOrCreateTempUser', () => {
    it('returns the existing user', async () => {
      const user = { name: '학사팀' } as User;
      userRepository.findUserByName.mockResolvedValue(user);

      await expect(service.findOrCreateTempUser(user)).resolves.toBe(user);
      expect(userRepository.createTempUser).not.toHaveBeenCalled();
    });

    it('creates a temp user when none exists', async () => {
      const user = { name: '학사팀' } as User;
      userRepository.findUserByName.mockResolvedValue(null as never);
      userRepository.createTempUser.mockResolvedValue(user);

      await expect(
        service.findOrCreateTempUser({ name: '학사팀' }),
      ).resolves.toBe(user);
      expect(userRepository.createTempUser).toHaveBeenCalledWith({
        name: '학사팀',
      });
    });
  });

  it('deletes the user by uuid', async () => {
    await service.deleteUser({ uuid: 'uuid' } as User);

    expect(userRepository.deleteUserByUuid).toHaveBeenCalledWith('uuid');
  });
});
