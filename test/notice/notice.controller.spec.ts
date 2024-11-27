import { Test, TestingModule } from '@nestjs/testing';
import { NoticeController } from 'src/notice/notice.controller';
import { NoticeService } from 'src/notice/notice.service';

describe('NoticeController', () => {
  let noticeController: NoticeController;
  let noticeService: NoticeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticeController],
      providers: [NoticeService],
    }).compile();

    noticeService = module.get<NoticeService>(NoticeService);
    noticeController = module.get<NoticeController>(NoticeController);
  });

  it('should be defined', () => {
    expect(noticeController).toBeDefined();
  });
});
