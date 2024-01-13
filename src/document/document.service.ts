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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'path';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(private readonly configService: ConfigService) {}

  async uploadDocuments(files: Express.Multer.File[]): Promise<string[]> {
    if (!files) {
      throw new BadRequestException('No documents sent');
    }
    return Promise.all(files.map((file) => this.uploadDocument(file)));
  }

  async validateDocuments(documentKeys: string[]): Promise<void> {
    if (!documentKeys) {
      throw new BadRequestException('No documents sent');
    }

    await Promise.all(
      documentKeys.map((documentKey) =>
        this.validateUploadedDocument(documentKey),
      ),
    );
  }

  async deleteDocuments(documentKeys: string[]): Promise<void> {
    if (!documentKeys) {
      return;
    }

    await Promise.all(
      documentKeys.map((documentKey) => this.deleteDocument(documentKey)),
    );
  }

  private async uploadDocument(file: Express.Multer.File): Promise<string> {
    const s3 = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
    });
    const key = `${new Date().toISOString()}-${Math.random()
      .toString(36)
      .substring(2)}.${path.extname(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
      Tagging: 'expiration=true',
      Metadata: {
        originalName: file.originalname,
      },
    });

    try {
      await s3.send(command);
      return key;
    } catch (error) {
      this.logger.error('error uploading document');
      this.logger.debug(error);
      throw new InternalServerErrorException("Couldn't uploading document");
    }
  }

  private async validateUploadedDocument(documentKey: string): Promise<void> {
    const s3 = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
    });
    const command = new PutObjectTaggingCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: documentKey,
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
      this.logger.error('error validating document');
      this.logger.debug(error);
      throw new BadRequestException('Invalid document');
    }
  }

  private async deleteDocument(documentKey: string): Promise<void> {
    const s3 = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
    });
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: documentKey,
    });

    try {
      await s3.send(command);
    } catch (error) {
      this.logger.error('error deleting document');
      this.logger.debug(error);
      throw new InternalServerErrorException("Couldn't delete document");
    }
  }
}
