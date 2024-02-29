import {
  DeleteObjectCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly s3Client: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.get('AWS_REGION'),
    });
  }

  /**
   * this method uploads a file to the S3 bucket
   * @param file Express.Multer.File
   * @param key string
   * @returns string
   */
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    this.logger.log('uploadFile called');
    const command = new PutObjectCommand({
      Bucket: this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
      Tagging: 'expiration=true',
      Metadata: {
        originalName: encodeURIComponent(file.originalname),
      },
    });

    await this.s3Client.send(command).catch((err) => {
      this.logger.error(err);
      throw new InternalServerErrorException();
    });
    return key;
  }

  /**
   * this method validates a file in the S3 bucket
   * specifically, it sets the expiration tag to false
   * @param key string
   * @returns void
   */
  async validateFile(key: string): Promise<void> {
    const command = new PutObjectTaggingCommand({
      Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
      Key: key,
      Tagging: {
        TagSet: [{ Key: 'expiration', Value: 'false' }],
      },
    });
    await this.s3Client.send(command).catch((err) => {
      this.logger.error(err);
      throw new InternalServerErrorException();
    });
  }

  /**
   * this method deletes a file from the S3 bucket
   * @param key string
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
      Key: key,
    });

    await this.s3Client.send(command).catch((err) => {
      this.logger.error(err);
      throw new InternalServerErrorException();
    });
  }
}
