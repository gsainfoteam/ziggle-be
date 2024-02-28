import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserOrCreate({
    uuid,
    name,
  }: Pick<User, 'uuid' | 'name'>): Promise<User> {
    this.logger.log('findUserOrCreate called');
    const user = await this.prismaService.user.findUnique({
      where: { uuid },
    });
    if (user) {
      this.logger.log('user found');
      return user;
    }
    this.logger.log('user not found, create new user');
    return this.prismaService.user.create({
      data: {
        uuid,
        name,
        consent: false,
      },
    });
  }

  async findUserAndUpdate({
    uuid,
    name,
  }: Pick<User, 'uuid' | 'name'>): Promise<User> {
    this.logger.log('findUserAndUpdate called');
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
      this.logger.log('user name is same');
      return user;
    }
    this.logger.log('user name is different, update user');
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
        this.logger.log('findUserAndUpdate finished');
        return user;
      });
  }

  async setConsent(user: User): Promise<User> {
    this.logger.log('setConsent called');
    return this.prismaService.user
      .update({
        where: { uuid: user.uuid },
        data: { consent: true },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025' || err.code === 'P2016') {
            this.logger.log('user not found');
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      })
      .then((user) => {
        this.logger.log('setConsent finished');
        return user;
      });
  }
}
