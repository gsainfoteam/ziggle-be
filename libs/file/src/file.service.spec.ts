import {
  DeleteObjectCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { InternalServerErrorException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { CustomConfigService } from '@lib/custom-config';
import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;
  let send: jest.SpyInstance;

  beforeEach(() => {
    send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    service = new FileService(
      mock<CustomConfigService>({
        AWS_S3_REGION: 'ap-northeast-2',
        AWS_S3_BUCKET_NAME: 'bucket',
      }),
    );
  });

  afterEach(() => {
    send.mockRestore();
  });

  const sentCommand = (index = 0) => send.mock.calls[index][0];

  it('uploads a file tagged for expiration', async () => {
    const file = {
      buffer: Buffer.from('data'),
      originalname: '안내문.pdf',
    } as Express.Multer.File;

    await expect(service.uploadFile(file, 'key')).resolves.toBe('key');

    expect(sentCommand()).toBeInstanceOf(PutObjectCommand);
    expect(sentCommand().input).toEqual({
      Bucket: 'bucket',
      Key: 'key',
      Body: file.buffer,
      Tagging: 'expiration=true',
      Metadata: { originalName: encodeURIComponent('안내문.pdf') },
    });
  });

  it('validates a file by clearing the expiration tag', async () => {
    await service.validateFile('key');

    expect(sentCommand()).toBeInstanceOf(PutObjectTaggingCommand);
    expect(sentCommand().input.Tagging).toEqual({
      TagSet: [{ Key: 'expiration', Value: 'false' }],
    });
  });

  it('deletes multiple files', async () => {
    await service.deleteFiles(['a', 'b']);

    expect(sentCommand(0)).toBeInstanceOf(DeleteObjectCommand);
    expect(send.mock.calls.map(([cmd]) => cmd.input.Key)).toEqual(['a', 'b']);
  });

  it.each([
    ['uploadFile', () => service.uploadFile({} as Express.Multer.File, 'k')],
    ['validateFile', () => service.validateFile('k')],
    ['deleteFile', () => service.deleteFile('k')],
  ])('%s throws InternalServerError when S3 fails', async (_, call) => {
    send.mockRejectedValue(new Error('s3'));

    await expect(call()).rejects.toThrow(InternalServerErrorException);
  });

  it('builds the public S3 url', () => {
    expect(service.getFilesUrl('key')).toBe(
      'https://s3.ap-northeast-2.amazonaws.com/bucket/key',
    );
  });
});
