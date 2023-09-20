import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'crypto';
import { NoticeController } from '../notice.controller';
import { testModule } from 'src/global/test/test.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from 'src/global/entity/notice.entity';
import { TagModule } from 'src/tag/tag.module';
import { UserModule } from 'src/user/user.module';
import { NoticeRepository } from '../notice.repository';
import { NoticeService } from '../notice.service';
import { ImageModule } from 'src/image/image.module';
import { FcmModule } from 'src/global/service/fcm.module';
import { UserRepository } from 'src/user/user.repository';
import { User } from 'src/global/entity/user.entity';

describe('NoticeController', () => {
  let controller: NoticeController;
  let repository: NoticeRepository;
  let userUuid = crypto.randomUUID();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        testModule,
        TypeOrmModule.forFeature([Notice]),
        TagModule,
        UserModule,
        ImageModule,
        FcmModule,
      ],
      controllers: [NoticeController],
      providers: [NoticeService, NoticeRepository],
    }).compile();

    controller = module.get<NoticeController>(NoticeController);
    repository = module.get<NoticeRepository>(NoticeRepository);
    const userRepository = module.get<UserRepository>(UserRepository);
    jest.spyOn(userRepository, 'findByUserUUID').mockResolvedValue(new User());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNoticeList', () => {
    it('should return an array of notices', async () => {
      const result = [new Notice()];
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue(result);
      expect(await controller.getNoticeList({})).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue(undefined);
      await expect(controller.getNoticeList({})).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue(null);
      await expect(controller.getNoticeList({})).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns empty array', async () => {
      jest.spyOn(repository, 'getNoticeList').mockResolvedValue([]);
      await expect(controller.getNoticeList({})).rejects.toThrow();
    });
  });

  describe('getNotice', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest
        .spyOn(repository, 'getNoticeAndUpdateviews')
        .mockResolvedValue(result);
      expect(await controller.getNotice(1)).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest
        .spyOn(repository, 'getNoticeAndUpdateviews')
        .mockResolvedValue(undefined);
      await expect(controller.getNotice(1)).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'getNoticeAndUpdateviews').mockResolvedValue(null);
      await expect(controller.getNotice(1)).rejects.toThrow();
    });
  });

  describe('createNotice', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'createNotice').mockResolvedValue(result);
      expect(
        await controller.createNotice(userUuid, {
          title: 'test',
          body: 'test',
          deadline: new Date(),
        }),
      ).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'createNotice').mockResolvedValue(undefined);
      await expect(
        controller.createNotice(userUuid, {
          title: 'test',
          body: 'test',
          deadline: new Date(),
        }),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'createNotice').mockResolvedValue(null);
      await expect(
        controller.createNotice(userUuid, {
          title: 'test',
          body: 'test',
          deadline: new Date(),
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateNotice', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'updateNotice').mockResolvedValue(result);
      expect(await controller.updateNotice(userUuid, 1, {})).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'updateNotice').mockResolvedValue(undefined);
      await expect(controller.updateNotice(userUuid, 1, {})).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'updateNotice').mockResolvedValue(null);
      await expect(controller.updateNotice(userUuid, 1, {})).rejects.toThrow();
    });
  });

  describe('updateNoticeTags', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'updateNoticeTags').mockResolvedValue(result);
      expect(await controller.updateNoticeTags(userUuid, 1, [2, 3])).toBe(
        result,
      );
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'updateNoticeTags').mockResolvedValue(undefined);
      await expect(
        controller.updateNoticeTags(userUuid, 1, [2, 3]),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'updateNoticeTags').mockResolvedValue(null);
      await expect(
        controller.updateNoticeTags(userUuid, 1, [2, 3]),
      ).rejects.toThrow();
    });
  });

  describe('updateNoticeReminder', () => {
    it('should return a notice', async () => {
      const result = new Notice();
      jest.spyOn(repository, 'updateNoticeReminder').mockResolvedValue(result);
      expect(await controller.updateNoticeReminder(userUuid, 1)).toBe(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      jest
        .spyOn(repository, 'updateNoticeReminder')
        .mockResolvedValue(undefined);
      await expect(
        controller.updateNoticeReminder(userUuid, 1),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'updateNoticeReminder').mockResolvedValue(null);
      await expect(
        controller.updateNoticeReminder(userUuid, 1),
      ).rejects.toThrow();
    });
  });

  describe('deleteNotice', () => {
    it('should throw NotFoundException when repository returns undefined', async () => {
      jest.spyOn(repository, 'deleteNotice').mockResolvedValue(undefined);
      await expect(controller.deleteNotice(userUuid, 1)).rejects.toThrow();
    });

    it('should throw NotFoundException when repository returns null', async () => {
      jest.spyOn(repository, 'deleteNotice').mockResolvedValue(null);
      await expect(controller.deleteNotice(userUuid, 1)).rejects.toThrow();
    });
  });
});
