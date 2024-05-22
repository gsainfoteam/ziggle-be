import { Injectable, Logger } from '@nestjs/common';
import path from 'path';
import { FileService } from 'src/file/file.service';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  constructor(private readonly fileService: FileService) {}

  /**
   * this method uploads multiple images to the S3 bucket
   * @param files Express.Multer.File[]
   * @returns string[]
   */
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    this.logger.log('uploadImages called');
    return Promise.all(files.map((file) => this.uploadImage(file)));
  }

  /**
   * this method validate multiple images in the S3 bucket
   * @param key string[]
   */
  async validateImages(key: string[]): Promise<void> {
    this.logger.log('validateImages called');
    await Promise.all(key.map((k) => this.validateImage(k)));
  }

  /**
   * this method deletes multiple images in the S3 bucket
   * @param key string[]
   */
  async deleteImages(key: string[]): Promise<void> {
    this.logger.log('deleteImages called');
    await Promise.all(key.map((k) => this.deleteImage(k)));
  }

  /**
   * this method uploads multiple images to the S3 bucket
   * @param files Express.Multer.File
   * @returns string
   */
  private async uploadImage(file: Express.Multer.File): Promise<string> {
    this.logger.log('uploadImage called');
    const key = `${new Date().toISOString()}-${Math.random().toString(36).substring(2)}.${path.extname(file.originalname)}`;
    return this.fileService.uploadFile(await this.convertToWebp(file), key);
  }

  /**
   * this method validate an image in the S3 bucket
   * @param key string
   */
  private async validateImage(key: string): Promise<void> {
    this.logger.log('validateUploadedImage called');
    await this.fileService.validateFile(key);
  }

  /**
   * this method deletes an image in the S3 bucket
   * @param key string
   */
  private async deleteImage(key: string): Promise<void> {
    this.logger.log('deleteImage called');
    await this.fileService.deleteFile(key);
  }

  /**
   * this method convert the image to webp format
   * @param file Express.Multer.File
   * @returns Express.Multer.File
   */
  private async convertToWebp(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    this.logger.log('convertToWebp called');
    file.buffer = await sharp(file.buffer)
      .rotate()
      .webp({ effort: 0 })
      .toBuffer();
    this.logger.log('convertToWebp finished');
    return file;
  }
}
