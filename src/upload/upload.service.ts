import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync, statSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessingService } from './services/image-processing.service';
import { StorageService } from './services/storage.service';
import {
  UploadMetadataDto,
  FileResponseDto,
  BulkUploadResponseDto,
  FileCategory,
} from './dto/upload.dto';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private imageProcessingService: ImageProcessingService,
    private storageService: StorageService,
  ) {}

  async uploadSingle(
    file: Express.Multer.File,
    metadata: UploadMetadataDto,
  ): Promise<FileResponseDto> {
    try {
      // 1. Traiter l'image (redimensionner, optimiser)
      const processedFile = await this.imageProcessingService.processImage(
        file,
        {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
          createThumbnail: true,
        },
      );

      // 2. Sauvegarder en base de données
      const savedFile = await this.prisma.uploadedFile.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          thumbnailPath: processedFile.thumbnailPath,
          category: metadata.category || FileCategory.ITEM_PHOTO,
          description: metadata.description,
          bookingId: metadata.bookingId,
          estimateId: metadata.estimateId,
        },
      });

      return this.formatFileResponse(savedFile);
    } catch (error) {
      // Nettoyer le fichier en cas d'erreur
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    metadata: UploadMetadataDto,
  ): Promise<BulkUploadResponseDto> {
    const results: BulkUploadResponseDto = {
      success: [],
      errors: [],
    };

    for (const file of files) {
      try {
        const result = await this.uploadSingle(file, metadata);
        results.success.push(result);
      } catch (error) {
        results.errors.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return results;
  }

  async getFileInfo(id: string): Promise<FileResponseDto> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.formatFileResponse(file);
  }

  async getFilePath(filename: string, thumbnail = false): Promise<string> {
    const file = await this.prisma.uploadedFile.findFirst({
      where: { filename },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = thumbnail && file.thumbnailPath ? file.thumbnailPath : file.path;

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return filePath;
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Supprimer les fichiers du disque
    if (existsSync(file.path)) {
      unlinkSync(file.path);
    }

    if (file.thumbnailPath && existsSync(file.thumbnailPath)) {
      unlinkSync(file.thumbnailPath);
    }

    // Supprimer de la base de données
    await this.prisma.uploadedFile.delete({
      where: { id },
    });
  }

  async getFilesByBooking(bookingId: string): Promise<FileResponseDto[]> {
    const files = await this.prisma.uploadedFile.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file) => this.formatFileResponse(file));
  }

  async getFilesByEstimate(estimateId: string): Promise<FileResponseDto[]> {
    const files = await this.prisma.uploadedFile.findMany({
      where: { estimateId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file) => this.formatFileResponse(file));
  }

  async getStorageInfo() {
    const totalFiles = await this.prisma.uploadedFile.count();
    const files = await this.prisma.uploadedFile.findMany({
      select: { size: true },
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      totalFiles,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024)),
      averageFileSizeMB: Math.round(totalSize / totalFiles / (1024 * 1024)) || 0,
    };
  }

  private formatFileResponse(file: any): FileResponseDto {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}/api/upload/serve/${file.filename}`,
      thumbnailUrl: file.thumbnailPath
        ? `${baseUrl}/api/upload/serve/${file.filename}?thumbnail=true`
        : undefined,
      category: file.category,
      description: file.description,
      uploadedAt: file.createdAt,
    };
  }
}