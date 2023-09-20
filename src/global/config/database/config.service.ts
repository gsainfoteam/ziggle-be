import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist';
import { FcmToken } from 'src/global/entity/fcmToken.entity';
import { Notice } from 'src/global/entity/notice.entity';
import { Tag } from 'src/global/entity/tag.entity';
import { User } from 'src/global/entity/user.entity';

@Injectable()
export class MySQLConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      username: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      port: this.configService.get<number>('DATABASE_PORT'),
      host: this.configService.get<string>('DATABASE_HOST'),
      database: this.configService.get<string>('DATABASE_NAME'),
      entities: [Notice, Tag, User, FcmToken],
      synchronize: true,
    };
  }
}
