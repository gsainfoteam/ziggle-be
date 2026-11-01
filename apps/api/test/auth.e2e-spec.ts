import {
  createFakeIdp,
  fakeUser,
  type FakeIdp,
  type FakeUser,
} from '@gsainfoteam/account-testing';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RedisModule } from '@nestjs-modules/ioredis';
import { mockDeep, mockReset } from 'jest-mock-extended';
import request from 'supertest';
import { User } from '@generated/prisma/client';
import { PrismaService } from '@lib/prisma';
import { UserModule } from '../src/user/user.module';

// sessions live in Redis, so this needs one at REDIS_HOST:REDIS_PORT (docker run -p 6379:6379 redis)
describe('auth (e2e)', () => {
  const prisma = mockDeep<PrismaService>();
  let idp: FakeIdp;
  let app: INestApplication;

  beforeAll(async () => {
    idp = await createFakeIdp({
      clients: [
        {
          clientId: process.env.CLIENT_ID!,
          clientSecret: process.env.CLIENT_SECRET,
          scopes: ['name'],
          optionalScopes: ['email', 'picture'],
        },
      ],
    });
    jest.spyOn(globalThis, 'fetch').mockImplementation(idp.fetch);

    const moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({
          type: 'single',
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        }),
        UserModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockReset(prisma);
  });

  const row = (user: FakeUser, overrides: Partial<User> = {}): User => ({
    uuid: user.sub,
    name: user.name!,
    email: user.email ?? null,
    picture: user.picture ?? null,
    createdAt: new Date(),
    consent: new Date(),
    isAdmin: false,
    ...overrides,
  });

  async function login(
    user: FakeUser,
    scopes?: ('name' | 'email' | 'picture')[],
  ): Promise<string> {
    prisma.user.upsert.mockResolvedValue(row(user));
    const { body } = await idp.authorize({
      clientId: process.env.CLIENT_ID!,
      user,
      scopes,
    });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...body, transport: 'body' })
      .expect(200);
    return res.body.access_token;
  }

  it('upserts the IdP user by uuid', async () => {
    const user = fakeUser();
    await login(user);

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { uuid: user.sub },
      create: {
        uuid: user.sub,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
      update: { name: user.name, email: user.email, picture: user.picture },
    });
  });

  it('keeps the stored email but clears the picture when the user declined them', async () => {
    const user = fakeUser();
    await login(user, ['name']);

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { name: user.name, email: undefined, picture: null },
      }),
    );
  });

  it('serves user info only to a consented session', async () => {
    const user = fakeUser();
    const token = await login(user);
    const server = app.getHttpServer();

    await request(server).get('/user/info').expect(401);

    prisma.user.findUniqueOrThrow.mockResolvedValue(
      row(user, { consent: null }),
    );
    await request(server)
      .get('/user/info')
      .set('authorization', `Bearer ${token}`)
      .expect(403);

    prisma.user.update.mockResolvedValue(row(user));
    await request(server)
      .post('/user/consent')
      .set('authorization', `Bearer ${token}`)
      .expect(201);

    prisma.user.findUniqueOrThrow.mockResolvedValue(row(user));
    const res = await request(server)
      .get('/user/info')
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.uuid).toBe(user.sub);
  });

  it('rejects the access token after logout', async () => {
    const user = fakeUser();
    const token = await login(user);
    prisma.user.findUniqueOrThrow.mockResolvedValue(row(user));
    const server = app.getHttpServer();

    await request(server)
      .post('/auth/logout')
      .set('authorization', `Bearer ${token}`)
      .expect(204);
    await request(server)
      .get('/user/info')
      .set('authorization', `Bearer ${token}`)
      .expect(401);
  });
});
