import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { v4 as uuid } from 'uuid';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';

@Injectable()
@Loggable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserOrCreate({
    uuid,
    name,
  }: Pick<User, 'uuid' | 'name'>): Promise<User> {
    const user = await this.prismaService.user
      .findUnique({
        where: { uuid },
      })
      .catch((err) => {
        this.logger.debug(err);
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserOrCreate(find) Prisma error');
          throw new InternalServerErrorException('Database error');
        }
        this.logger.error('findUserOrCreate(find) error');
        throw new InternalServerErrorException('Unknown error');
      });
    if (user) {
      return user;
    }
    return this.prismaService.user
      .create({
        data: {
          uuid,
          name,
          consent: false,
        },
      })
      .catch((err) => {
        this.logger.debug(err);
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserOrCreate(create) Prisma error');
          throw new InternalServerErrorException('Database error');
        }
        this.logger.error('findUserOrCreate(create) error');
        throw new InternalServerErrorException('Unknown error');
      });
  }

  async findUserAndUpdate({
    uuid,
    name,
  }: Pick<User, 'uuid' | 'name'>): Promise<User> {
    const user = await this.prismaService.user
      .findUniqueOrThrow({
        where: { uuid },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2016') {
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      });
    if (user.name === name) {
      return user;
    }
    return this.prismaService.user
      .update({
        where: { uuid },
        data: { name },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      })
      .then((user) => {
        return user;
      });
  }

  async setConsent(user: User): Promise<User> {
    return this.prismaService.user
      .update({
        where: { uuid: user.uuid },
        data: { consent: true },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025' || err.code === 'P2016') {
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      })
      .then((user) => {
        return user;
      });
  }

  async findUserByName({ name }: Pick<User, 'name'>): Promise<User | null> {
    return this.prismaService.user
      .findFirst({
        where: { name },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      });
  }

  async createTempUser({ name }: Pick<User, 'name'>): Promise<User> {
    return this.prismaService.user
      .create({
        data: {
          uuid: uuid(),
          name,
          consent: false,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      });
  }

  async setFcmToken(
    userUuid: string | undefined,
    { fcmToken }: setFcmTokenReq,
  ) {
    await this.prismaService.fcmToken
      .upsert({
        where: { fcmTokenId: fcmToken },
        update: {
          userUuid: userUuid ?? null,
        },
        create: {
          fcmTokenId: fcmToken,
          userUuid: userUuid ?? null,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error(err.message);
          //TODO 여러 error case 생각해보기(일단 500 return 하도록 함)
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      });
    return { message: 'success', fcmToken: fcmToken };
  }

  async deleteFcmToken(fcmToken: string): Promise<void> {
    await this.prismaService.fcmToken
      .delete({
        where: { fcmTokenId: fcmToken },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.debug('fcm token not found. Just ignore it');
            return;
          }
          this.logger.error(err.message);
        }
        this.logger.error(err);
        throw err;
      });
  }
}
