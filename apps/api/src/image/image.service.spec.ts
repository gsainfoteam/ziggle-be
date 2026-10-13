import { BadRequestException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import sharp from 'sharp';
import { FileService } from '@lib/file/file.service';
import { ImageService } from './image.service';

const buildFile = (buffer: Buffer, originalname = 'photo.png') =>
  ({ buffer, originalname }) as Express.Multer.File;

describe('ImageService', () => {
  let service: ImageService;
  let fileService: MockProxy<FileService>;

  beforeEach(() => {
    fileService = mock<FileService>();
    fileService.uploadFile.mockImplementation(async (_, key) => key);
    service = new ImageService(fileService);
  });

  describe('uploadImages', () => {
    it('converts images to webp before uploading', async () => {
      const png = await sharp({
        create: { width: 2, height: 2, channels: 3, background: '#fff' },
      })
        .png()
        .toBuffer();

      const [key] = await service.uploadImages([buildFile(png)]);

      const [uploaded] = fileService.uploadFile.mock.calls[0];
      const metadata = await sharp(uploaded.buffer).metadata();
      expect(metadata.format).toBe('webp');
      expect(key).toMatch(/png$/);
    });

    it('throws BadRequest when no files are given', async () => {
      await expect(service.uploadImages([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequest for a non-image file', async () => {
      await expect(
        service.uploadImages([buildFile(Buffer.from('not an image'))]),
      ).rejects.toThrow(BadRequestException);
      expect(fileService.uploadFile).not.toHaveBeenCalled();
    });
  });

  it('validates every image key', async () => {
    await service.validateImages(['a', 'b']);

    expect(fileService.validateFile).toHaveBeenCalledWith('a');
    expect(fileService.validateFile).toHaveBeenCalledWith('b');
  });

  it('deletes every image key', async () => {
    await service.deleteImages(['a', 'b']);

    expect(fileService.deleteFile).toHaveBeenCalledWith('a');
    expect(fileService.deleteFile).toHaveBeenCalledWith('b');
  });
});
