import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { createFakeIdp, fakeUser, FakeIdp } from '@infoteam/account-testing';
import { User } from '@generated/prisma/client';
import { CustomConfigService } from '@lib/custom-config';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { RedisService } from 'libs/redis/src';
import { AccountModule } from '../../src/auth/account';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthRepository } from '../../src/auth/auth.repository';
import { AuthService } from '../../src/auth/auth.service';

describe('Auth API with the account SDK', () => {
  const clientId = 'ziggle-test';
  let idp: FakeIdp;
  let app: INestApplication;
  const users = new Map<string, User>();
  const cache = new Map<string, unknown>();

  beforeAll(async () => {
    idp = await createFakeIdp();
    jest.spyOn(globalThis, 'fetch').mockImplementation(idp.fetch);

    const module = await Test.createTestingModule({
      imports: [
        AccountModule.forRoot({
          issuer: 'https://idp.test',
          clientId,
          clientSecret: 'secret',
        }),
        JwtModule.register({
          secret: 'jwt-secret',
          signOptions: { expiresIn: 60, issuer: 'ziggle', audience: 'ziggle' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserOrCreate: async (data: Pick<User, 'uuid'>) => {
              const user = { ...users.get(data.uuid), ...data } as User;
              users.set(user.uuid, user);
              return user;
            },
            findUserByUuid: async (uuid: string) => users.get(uuid),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: async (key: string, value: unknown) => cache.set(key, value),
            get: async (key: string) => cache.get(key) ?? null,
            del: async (key: string) => cache.delete(key),
          },
        },
        {
          provide: InfoteamIdpService,
          useValue: {
            getUserInfo: async (token: string) => {
              if (token !== 'idp-token') throw new UnauthorizedException();
              return {
                uuid: 'legacy-user',
                name: 'Legacy',
                email: 'legacy@gist.ac.kr',
                picture: null,
              };
            },
          },
        },
        {
          provide: CustomConfigService,
          useValue: { REFRESH_TOKEN_EXPIRE: '14d' },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    app.useLogger(false);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  async function authorize(user = fakeUser()) {
    const { body } = await idp.authorize({ clientId, user });
    return body;
  }

  it('links the IdP user and issues a refresh cookie on web login', async () => {
    const user = fakeUser();
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...(await authorize(user)), transport: 'cookie' })
      .expect(200);

    expect(res.body.access_token).toEqual(expect.any(String));
    expect(res.body.refresh_token).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(
      /^refresh_token=.+; Path=\/auth; .*HttpOnly; Secure; SameSite=Strict/,
    );
    expect(users.get(user.sub)).toMatchObject({
      name: user.name,
      email: user.email,
    });
  });

  it('refreshes and logs out with the cookie', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(await authorize());
    const cookie = login.headers['set-cookie'];

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('cookie', cookie)
      .expect(200);
    expect(refreshed.body).toEqual({ access_token: expect.any(String) });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('cookie', cookie)
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('cookie', cookie)
      .expect(401);
  });

  it('keeps the refresh token in the body for apps', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...(await authorize()), transport: 'body' })
      .expect(200);
    const { refresh_token } = login.body;
    expect(refresh_token).toEqual(expect.any(String));
    expect(login.headers['set-cookie']).toBeUndefined();

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token, transport: 'body' })
      .expect(200);
    expect(refreshed.body.refresh_token).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refresh_token, transport: 'body' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token, transport: 'body' })
      .expect(401);
  });

  it('rejects a code that was already used', async () => {
    const body = await authorize();
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(200);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(401);
    expect(res.body.error).toBe('invalid_grant');
  });

  it('rejects a login without a code', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ transport: 'cookie' })
      .expect(400);
  });
  it('still logs in old app versions that send an IdP access token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('authorization', 'Bearer idp-token')
      .expect(200);
    expect(login.body).toEqual({ access_token: expect.any(String) });
    expect(users.get('legacy-user')).toMatchObject({ name: 'Legacy' });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('cookie', login.headers['set-cookie'])
      .expect(200);
  });

  it('rejects an IdP access token the IdP does not accept', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('authorization', 'Bearer forged')
      .expect(401);
  });
});
