import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { testModule } from 'src/global/test/test.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/global/entity/user.entity';
import { HttpModule } from '@nestjs/axios';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [testModule, TypeOrmModule.forFeature([User]), HttpModule],
      controllers: [UserController],
      providers: [UserService, UserRepository],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
