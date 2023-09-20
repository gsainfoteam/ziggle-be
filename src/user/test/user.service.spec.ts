import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { testModule } from 'src/global/test/test.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/global/entity/user.entity';
import { UserRepository } from '../user.repository';
import { HttpModule } from '@nestjs/axios';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [testModule, TypeOrmModule.forFeature([User]), HttpModule],
      providers: [UserService, UserRepository],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getJwtTokenFromIdP', () => {
    it('should return jwtToken', async () => {
      //httpModule이 도입되어야 mock을 사용할 수 있음 따라서 나중에 정의
    });
  });
});
