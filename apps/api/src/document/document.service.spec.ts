import { mock, MockProxy } from 'jest-mock-extended';
import { FileService } from '@lib/file/file.service';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let fileService: MockProxy<FileService>;

  beforeEach(() => {
    fileService = mock<FileService>();
    fileService.uploadFile.mockImplementation(async (_, key) => key);
    service = new DocumentService(fileService);
  });

  it('uploads each document as-is with a unique key', async () => {
    const files = [
      { originalname: 'a.pdf', buffer: Buffer.from('a') },
      { originalname: 'b.hwp', buffer: Buffer.from('b') },
    ] as Express.Multer.File[];

    const keys = await service.uploadDocuments(files);

    expect(fileService.uploadFile).toHaveBeenCalledWith(
      files[0],
      expect.stringMatching(/pdf$/),
    );
    expect(keys[1]).toMatch(/hwp$/);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('validates every document key', async () => {
    await service.validateDocuments(['a', 'b']);

    expect(fileService.validateFile).toHaveBeenCalledTimes(2);
  });

  it('deletes every document key', async () => {
    await service.deleteDocuments(['a']);

    expect(fileService.deleteFile).toHaveBeenCalledWith('a');
  });
});
