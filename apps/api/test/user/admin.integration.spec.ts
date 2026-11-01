import { memorySessionStore } from '@gsainfoteam/account-nest';
import { createFakeIdp, fakeUser } from '@gsainfoteam/account-testing';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, User } from '@generated/prisma/client';
import { PrismaService } from '@lib/prisma';
import request from 'supertest';
import { AccountModule } from '../../src/auth/account';
import { AuthRepository } from '../../src/auth/auth.repository';
import { AuthService } from '../../src/auth/auth.service';
import { AdminGuard } from '../../src/auth/guard/admin.guard';
import { JwtGuard } from '../../src/auth/guard/jwt.guard';
import { JwtStrategy } from '../../src/auth/guard/jwt.strategy';
import { UserController } from '../../src/user/user.controller';
import { UserRepository } from '../../src/user/user.repository';
import { UserService } from '../../src/user/user.service';

describe('Admin permission API', () => {
  let app: INestApplication;
  let users: Map<string, User>;
  const adminUuid = '123e4567-e89b-42d3-a456-426614174000';
  const targetUuid = '123e4567-e89b-42d3-a456-426614174001';
  const missingUuid = '123e4567-e89b-42d3-a456-426614174002';
  const clientId = 'ziggle-test';
  const update = jest.fn();
  const findUniqueOrThrow = jest.fn();
  const tokens = new Map<string, string>();
  const token = (uuid: string) => tokens.get(uuid)!;

  beforeAll(async () => {
    const idp = await createFakeIdp();
    jest.spyOn(globalThis, 'fetch').mockImplementation(idp.fetch);
    const prisma = { user: { update, findUniqueOrThrow } };
    const authRepository = new AuthRepository(
      prisma as unknown as PrismaService,
    );
    const module = await Test.createTestingModule({
      imports: [
        AccountModule.forRoot({
          issuer: 'staging',
          clientId,
          clientSecret: 'ziggle-test-secret',
          session: {
            secret: 'admin-integration-test-secret-32-chars',
            store: memorySessionStore(),
            resolve: (user) => ({ subject: user.sub }),
          },
        }),
      ],
      controllers: [UserController],
      providers: [
        UserService,
        UserRepository,
        JwtStrategy,
        JwtGuard,
        AdminGuard,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AuthService,
          useValue: {
            findUserByUuid: (uuid: string) =>
              authRepository.findUserByUuid(uuid),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.init();

    for (const uuid of [adminUuid, targetUuid, missingUuid]) {
      const { body } = await idp.authorize({
        clientId,
        user: fakeUser({ sub: uuid }),
      });
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...body, transport: 'body' })
        .expect(200);
      tokens.set(uuid, res.body.access_token);
    }
  });

  beforeEach(() => {
    const makeUser = (uuid: string, isAdmin: boolean): User => ({
      uuid,
      name: 'Test user',
      email: null,
      picture: null,
      createdAt: new Date(),
      consent: new Date(),
      isAdmin,
    });
    users = new Map([
      [adminUuid, makeUser(adminUuid, true)],
      [targetUuid, makeUser(targetUuid, false)],
    ]);
    jest.resetAllMocks();
    const findUser = (uuid: string) => {
      const user = users.get(uuid);
      if (!user) {
        throw new Prisma.PrismaClientKnownRequestError('User not found', {
          code: 'P2025',
          clientVersion: '7.8.0',
        });
      }
      return { ...user };
    };
    findUniqueOrThrow.mockImplementation(async ({ where }) =>
      findUser(where.uuid),
    );
    update.mockImplementation(async ({ where, data }) => {
      const updatedUser = { ...findUser(where.uuid), ...data };
      users.set(where.uuid, updatedUser);
      return updatedUser;
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const setAdmin = (body: object, uuid = targetUuid, caller = adminUuid) =>
    request(app.getHttpServer())
      .patch(`/user/${uuid}/admin`)
      .auth(token(caller), { type: 'bearer' })
      .send(body);

  it('grants admin permission and exposes it in user info', async () => {
    const response = await setAdmin({ isAdmin: true }).expect(200);
    expect(response.body).toMatchObject({ uuid: targetUuid, isAdmin: true });
    const info = await request(app.getHttpServer())
      .get('/user/info')
      .auth(token(targetUuid), { type: 'bearer' })
      .expect(200);
    expect(info.body.isAdmin).toBe(true);
  });

  it('revokes permission immediately for an already issued JWT', async () => {
    users.get(targetUuid)!.isAdmin = true;
    const existingToken = token(targetUuid);
    await setAdmin({ isAdmin: false }).expect(200);
    await request(app.getHttpServer())
      .patch(`/user/${adminUuid}/admin`)
      .auth(existingToken, { type: 'bearer' })
      .send({ isAdmin: false })
      .expect(403);
    expect(users.get(adminUuid)!.isAdmin).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('allows repeated permission updates', async () => {
    await setAdmin({ isAdmin: true }).expect(200);
    await setAdmin({ isAdmin: true }).expect(200);
    expect(users.get(targetUuid)!.isAdmin).toBe(true);
  });

  it('rejects self-promotion by a regular user', async () => {
    await setAdmin({ isAdmin: true }, targetUuid, targetUuid).expect(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('requires consent even for admins', async () => {
    users.get(adminUuid)!.consent = null;
    await setAdmin({ isAdmin: true }).expect(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .patch(`/user/${targetUuid}/admin`)
      .send({ isAdmin: true })
      .expect(401);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects JWTs with a forged signature', async () => {
    const [header, payload] = token(adminUuid).split('.');
    await request(app.getHttpServer())
      .patch(`/user/${targetUuid}/admin`)
      .auth(`${header}.${payload}.${'A'.repeat(43)}`, { type: 'bearer' })
      .send({ isAdmin: true })
      .expect(401);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects tokens for users who no longer exist', async () => {
    await setAdmin({ isAdmin: true }, targetUuid, missingUuid).expect(401);
    expect(update).not.toHaveBeenCalled();
  });

  it('returns 500 instead of 401 when the user lookup fails', async () => {
    findUniqueOrThrow.mockRejectedValueOnce(new Error('Database unavailable'));
    await setAdmin({ isAdmin: true }).expect(500);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([{}, { isAdmin: 'true' }, { isAdmin: 1 }, { isAdmin: null }])(
    'rejects invalid request body %p',
    async (body) => {
      await setAdmin(body).expect(400);
      expect(update).not.toHaveBeenCalled();
    },
  );

  it('rejects an invalid target UUID', async () => {
    await setAdmin({ isAdmin: true }, 'invalid-uuid').expect(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown target user', async () => {
    await setAdmin({ isAdmin: true }, missingUuid).expect(404);
  });

  it('returns 500 when the database update fails', async () => {
    update.mockRejectedValueOnce(new Error('Database unavailable'));
    await setAdmin({ isAdmin: true }).expect(500);
    expect(users.get(targetUuid)!.isAdmin).toBe(false);
  });

  it('ignores unrelated fields in the request', async () => {
    await setAdmin({ isAdmin: true, name: 'Changed', consent: null }).expect(
      200,
    );
    expect(users.get(targetUuid)).toMatchObject({
      name: 'Test user',
      isAdmin: true,
    });
    expect(users.get(targetUuid)!.consent).not.toBeNull();
  });
});
