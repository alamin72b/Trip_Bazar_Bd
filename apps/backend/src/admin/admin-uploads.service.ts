import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import fs from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { resolveUploadRootDir } from '../config/upload-root-dir.util';
import { AdminUploadedImageDto } from './dto/admin-uploaded-image.dto';
import { UploadedImageFile } from './interfaces/uploaded-image-file.interface';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class AdminUploadsService {
  private readonly uploadRootDir: string;
  private readonly offerImagesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadRootDir = resolveUploadRootDir(
      this.configService.get<string>('app.uploadRootDir'),
      this.configService.get<string>('app.nodeEnv'),
    );
    this.offerImagesDir = path.join(this.uploadRootDir, 'offers');

    fs.mkdirSync(this.offerImagesDir, { recursive: true });
  }

  async storeOfferImages(
    files: UploadedImageFile[],
    request: Request,
  ): Promise<AdminUploadedImageDto[]> {
    if (files.length === 0) {
      throw new BadRequestException('Upload at least one image.');
    }

    const uploadedImages: AdminUploadedImageDto[] = [];

    for (const file of files) {
      this.validateImage(file);

      const filename = this.createFilename(file);
      const outputPath = path.join(this.offerImagesDir, filename);

      await writeFile(outputPath, file.buffer);

      uploadedImages.push({
        filename,
        url: this.buildPublicUrl(request, filename),
      });
    }

    return uploadedImages;
  }

  private validateImage(file: UploadedImageFile): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, and WebP images are supported.',
      );
    }
  }

  private createFilename(file: UploadedImageFile): string {
    const extension =
      path.extname(file.originalname).toLowerCase() ||
      this.getExtensionFromMimeType(file.mimetype);

    return `${randomUUID()}${extension}`;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    if (mimeType === 'image/png') {
      return '.png';
    }

    if (mimeType === 'image/webp') {
      return '.webp';
    }

    return '.jpg';
  }

  private buildPublicUrl(request: Request, filename: string): string {
    const forwardedProtocol = request.header('x-forwarded-proto');
    const protocol = forwardedProtocol ?? request.protocol;
    const host = request.get('host');

    return `${protocol}://${host}/uploads/offers/${filename}`;
  }
}
