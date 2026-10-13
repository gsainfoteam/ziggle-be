import { HttpService } from '@nestjs/axios';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { of, throwError } from 'rxjs';
import { CustomConfigService } from '@lib/custom-config';
import { InfoteamIdpService } from './infoteam-idp.service';

const axiosError = (status: number) =>
  new AxiosError('error', String(status), undefined, undefined, {
    status,
  } as AxiosResponse);

describe('InfoteamIdpService', () => {
  let service: InfoteamIdpService;
  let httpService: MockProxy<HttpService>;

  beforeEach(() => {
    httpService = mock<HttpService>();
    service = new InfoteamIdpService(
      httpService,
      mock<CustomConfigService>({ IDP_URL: 'http://idp.test' }),
    );
  });

  it('maps the idp userinfo response', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          sub: 'uuid',
          name: '홍길동',
          email: 'a@gist.ac.kr',
          student_id: '20260000',
        },
      } as AxiosResponse),
    );

    await expect(service.getUserInfo('token')).resolves.toEqual({
      uuid: 'uuid',
      name: '홍길동',
      email: 'a@gist.ac.kr',
      picture: null,
      studentNumber: '20260000',
    });
    expect(httpService.get).toHaveBeenCalledWith('http://idp.test/userinfo', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('throws Unauthorized when the idp responds 401', async () => {
    httpService.get.mockReturnValue(throwError(() => axiosError(401)));

    await expect(service.getUserInfo('token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws InternalServerError for other errors', async () => {
    httpService.get.mockReturnValue(throwError(() => axiosError(500)));

    await expect(service.getUserInfo('token')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
