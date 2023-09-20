import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'crypto';
import { NoticeService } from '../notice.service';
import { testModule } from 'src/global/test/test.module';
import { Notice } from 'src/global/entity/notice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeRepository } from '../notice.repository';
import { UserModule } from 'src/user/user.module';
import { TagModule } from 'src/tag/tag.module';
import { UserRepository } from 'src/user/user.repository';
import { User } from 'src/global/entity/user.entity';
import { ImageModule } from 'src/image/image.module';
import { FcmModule } from 'src/global/service/fcm.module';

describe('NoticeService', () => {
  let service: NoticeService;
  let repository: NoticeRepository;
  const userUuid = crypto.randomUUID();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        testModule,
        TypeOrmModule.forFeature([Notice]),
        UserModule,
        TagModule,
        ImageModule,
        FcmModule,
      ],
      providers: [NoticeService, NoticeRepository],
    }).compile();

    service = module.get<NoticeService>(NoticeService);
    repository = module.get<NoticeRepository>(NoticeRepository);
    const userRepository = module.get(UserRepository);
    jest.spyOn(userRepository, 'findByUserUUID').mockResolvedValue(new User());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNoticeList', () => {
    it('should return an array of notices', async () => {
      const result = [new Notice()];
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue(result);
      expect(await service.getNoticeList({ offset: 0, limit: 10 })).toBe(
        result,
      );
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue(undefined);
      await expect(
        service.getNoticeList({ offset: 0, limit: 10 }),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue(null);
      await expect(
        service.getNoticeList({ offset: 0, limit: 10 }),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns empty array', async () => {
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue([]);
      await expect(
        service.getNoticeList({ offset: 0, limit: 10 }),
      ).rejects.toThrow();
    });
  });

  describe('getNotice', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest
        .spyOn(repository, 'getNoticeAndUpdateviews')
        .mockResolvedValue(result);
      expect(await service.getNotice(1)).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest
        .spyOn(repository, 'getNoticeAndUpdateviews')
        .mockResolvedValue(undefined);
      await expect(service.getNotice(1)).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'getNoticeAndUpdateviews').mockResolvedValue(null);
      await expect(service.getNotice(1)).rejects.toThrow();
    });
  });

  describe('createNotice', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'createNotice').mockResolvedValue(result);
      expect(
        await service.createNotice(
          { title: 'test', body: 'test', deadline: new Date() },
          userUuid,
        ),
      ).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'createNotice').mockResolvedValue(undefined);
      await expect(
        service.createNotice(
          { title: 'test', body: 'test', deadline: new Date() },
          'test',
        ),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'createNotice').mockResolvedValue(null);
      await expect(
        service.createNotice(
          { title: 'test', body: 'test', deadline: new Date() },
          'test',
        ),
      ).rejects.toThrow();
    });
  });

  describe('updateNotice', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'updateNotice').mockResolvedValue(result);
      expect(
        await service.updateNotice(
          1,
          {
            title: 'test',
            body: 'test',
            deadline: new Date(),
          },
          userUuid,
        ),
      ).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'updateNotice').mockResolvedValue(undefined);
      await expect(
        service.updateNotice(
          1,
          {
            title: 'test',
            body: 'test',
            deadline: new Date(),
          },
          userUuid,
        ),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'updateNotice').mockResolvedValue(null);
      await expect(
        service.updateNotice(
          1,
          {
            title: 'test',
            body: 'test',
            deadline: new Date(),
          },
          userUuid,
        ),
      ).rejects.toThrow();
    });
  });

  describe('updateNoticeTags', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'updateNoticeTags').mockResolvedValue(result);
      expect(await service.updateNoticeTags(1, [2, 3], userUuid)).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'updateNoticeTags').mockResolvedValue(undefined);
      await expect(
        service.updateNoticeTags(1, [2, 3], userUuid),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'updateNoticeTags').mockResolvedValue(null);
      await expect(
        service.updateNoticeTags(1, [2, 3], userUuid),
      ).rejects.toThrow();
    });
  });

  describe('updateNoticeReminder', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'updateNoticeReminder').mockResolvedValue(result);
      expect(await service.addNoticeReminder(1, userUuid)).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest
        .spyOn(repository, 'updateNoticeReminder')
        .mockResolvedValue(undefined);
      await expect(service.addNoticeReminder(1, userUuid)).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'updateNoticeReminder').mockResolvedValue(null);
      await expect(service.addNoticeReminder(1, userUuid)).rejects.toThrow();
    });
  });

  describe('deleteNotice', () => {
    it('should return a notice', async () => {
      jest.spyOn(repository, 'deleteNotice').mockResolvedValue(new Notice());
      expect(await service.deleteNotice(1, userUuid)).toBe(void 0);
    });

    it('should throw NotFoundException when DeleteResult returns { affected: 0 }', async () => {
      jest.spyOn(repository, 'deleteNotice').mockResolvedValue(null);
      await expect(service.deleteNotice(1, userUuid)).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'deleteNotice').mockResolvedValue(undefined);
      await expect(service.deleteNotice(1, userUuid)).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'deleteNotice').mockResolvedValue(null);
      await expect(service.deleteNotice(1, userUuid)).rejects.toThrow();
    });
  });
});
