import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { mock, MockProxy } from 'jest-mock-extended';
import { User } from '@generated/prisma/client';
import { CustomConfigService } from '@lib/custom-config';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { RedisService } from 'libs/redis/src';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const UUID = 'user-uuid';
const PREFIX = 'ziggleRefreshToken';

describe('AuthService', () => {
  let service: AuthService;
  let idpService: MockProxy<InfoteamIdpService>;
  let authRepository: MockProxy<AuthRepository>;
  let jwtService: MockProxy<JwtService>;
  let redisService: MockProxy<RedisService>;

  beforeEach(() => {
    idpService = mock<InfoteamIdpService>();
    authRepository = mock<AuthRepository>();
    jwtService = mock<JwtService>();
    redisService = mock<RedisService>();
    jwtService.sign.mockReturnValue('access-token');

    service = new AuthService(
      mock<CustomConfigService>({ REFRESH_TOKEN_EXPIRE: '30d' }),
      idpService,
      authRepository,
      jwtService,
      redisService,
    );
  });

  describe('login', () => {
    it('issues tokens and stores the refresh token in redis', async () => {
      const userInfo = { uuid: UUID } as Awaited<
        ReturnType<InfoteamIdpService['getUserInfo']>
      >;
      idpService.getUserInfo.mockResolvedValue(userInfo);
      authRepository.findUserOrCreate.mockResolvedValue({
        uuid: UUID,
      } as User);

      const tokens = await service.login('Bearer idp-token');

      expect(idpService.getUserInfo).toHaveBeenCalledWith('idp-token');
      expect(authRepository.findUserOrCreate).toHaveBeenCalledWith(userInfo);
      expect(tokens.access_token).toBe('access-token');
      expect(tokens.refresh_token).toMatch(/^[A-Za-z0-9]+$/);
      expect(jwtService.sign).toHaveBeenCalledWith({}, { subject: UUID });
      expect(redisService.set).toHaveBeenCalledWith(
        tokens.refresh_token,
        UUID,
        { prefix: PREFIX, ttl: 30 * 24 * 60 * 60 },
      );
    });

    it('throws Unauthorized when the user cannot be found or created', async () => {
      idpService.getUserInfo.mockResolvedValue({} as never);
      authRepository.findUserOrCreate.mockRejectedValue(new Error('db'));

      await expect(service.login('Bearer idp-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('issues a new access token for a valid refresh token', async () => {
      redisService.get.mockResolvedValue(UUID);
      authRepository.findUserByUuid.mockResolvedValue({ uuid: UUID } as User);

      const tokens = await service.refresh('refresh-token');

      expect(redisService.get).toHaveBeenCalledWith('refresh-token', {
        prefix: PREFIX,
      });
      expect(tokens).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });

    it('throws Unauthorized for an unknown refresh token', async () => {
      redisService.get.mockResolvedValue(undefined as never);

      await expect(service.refresh('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('removes the refresh token from redis', async () => {
      await service.logout('refresh-token');

      expect(redisService.del).toHaveBeenCalledWith('refresh-token', {
        prefix: PREFIX,
      });
    });
  });
});
