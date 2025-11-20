import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';

@Injectable()
@Loggable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserOrCreate({
    uuid,
    name,
    email,
  }: Pick<User, 'uuid' | 'name' | 'email'>): Promise<User> {
    return await this.prismaService.user
      .upsert({
        where: { uuid },
        create: {
          uuid,
          name,
          email,
          consent: false,
        },
        update: {
          name,
          email,
        },
      })
      .catch((err) => {
        this.logger.debug(err);
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserOrCreate Prisma error');
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserOrCreate error');
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return await this.prismaService.user
      .findUniqueOrThrow({
        where: { uuid },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException();
          }
          this.logger.error(error.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(error.message);
        throw new InternalServerErrorException();
      });
  }
}
