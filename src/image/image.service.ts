import {
  DeleteObjectCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  constructor(private readonly configService: ConfigService) {}

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!files) {
      throw new BadRequestException('No images sent');
    }
    return Promise.all(files.map((file) => this.uploadImage(file)));
  }

  async validateImages(imageKeys: string[]): Promise<void> {
    if (!imageKeys) {
      throw new BadRequestException('No images sent');
    }

    await Promise.all(
      imageKeys.map((imageKey) => this.validateUploadedImage(imageKey)),
    );
  }

  async deleteImages(imageKeys: string[]): Promise<void> {
    if (!imageKeys) {
      return;
    }

    await Promise.all(imageKeys.map((imageKey) => this.deleteImage(imageKey)));
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const s3 = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
    });
    const key = `${new Date().toISOString()}-${Math.random()
      .toString(36)
      .substring(2)}.webp`;

    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
      Body: await this.convertToWebp(file),
      Tagging: 'expiration=true',
      Metadata: {
        originalName: file.originalname,
      },
    });

    try {
      await s3.send(command);
      return key;
    } catch (error) {
      this.logger.error('error uploading image');
      this.logger.debug(error);
      throw new InternalServerErrorException("Couldn't upload image");
    }
  }

  private async validateUploadedImage(imageKey: string): Promise<void> {
    const s3 = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
    });
    const command = new PutObjectTaggingCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: imageKey,
      Tagging: {
        TagSet: [
          {
            Key: 'expiration',
            Value: 'false',
          },
        ],
      },
    });

    try {
      await s3.send(command);
    } catch (error) {
      this.logger.error('error validating image');
      this.logger.debug(error);
      throw new NotFoundException(`Image with key "${imageKey}" not found`);
    }
  }

  private async deleteImage(imageKey: string): Promise<void> {
    const s3 = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
    });

    const command = new DeleteObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: imageKey,
    });

    try {
      await s3.send(command);
    } catch (e) {
      this.logger.error('error deleting image');
      this.logger.debug(e);
      throw new InternalServerErrorException("Couldn't delete image");
    }
  }

  private async convertToWebp(file: Express.Multer.File): Promise<Buffer> {
    return sharp(file.buffer).webp().toBuffer();
  }
}
