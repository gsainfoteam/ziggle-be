import { Loggable } from '@lib/logger/decorator/loggable';
import { Injectable, Logger } from '@nestjs/common';
import path from 'path';
import { FileService } from 'src/file/file.service';

@Injectable()
@Loggable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(private readonly fileService: FileService) {}

  /**
   * this method uploads multiple documents to the S3 bucket
   * @param files Express.Multer.File[]
   * @returns string[]
   */
  async uploadDocuments(files: Express.Multer.File[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadDocument(file)));
  }

  /**
   * this method validate multiple documents in the S3 bucket
   * @param key string[]
   * @returns void
   */
  async validateDocuments(key: string[]): Promise<void> {
    await Promise.all(key.map((k) => this.validationDocument(k)));
  }

  /**
   * this method deletes multiple documents in the S3 bucket
   * @param key string[]
   * @returns void
   */
  async deleteDocuments(key: string[]): Promise<void> {
    await Promise.all(key.map((k) => this.deleteDocument(k)));
  }

  /**
   * this method uploads a document to the S3 bucket
   * @param file Express.Multer.File
   * @returns string
   */
  private async uploadDocument(file: Express.Multer.File): Promise<string> {
    const key = `${new Date().toISOString()}-${Math.random().toString(36).substring(2)}.${path.extname(file.originalname)}`;
    return this.fileService.uploadFile(file, key);
  }

  /**
   * this method validates a document in the S3 bucket
   * @param key
   * @returns void
   */
  private async validationDocument(key: string): Promise<void> {
    return this.fileService.validateFile(key);
  }

  /**
   * this method deletes a document in the S3 bucket
   * @param key
   * @returns void
   */
  private async deleteDocument(key: string): Promise<void> {
    return this.fileService.deleteFile(key);
  }
}
