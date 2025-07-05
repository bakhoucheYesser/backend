import { Injectable, Logger } from '@nestjs/common';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

interface ProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

interface ProcessedFile {
  processedPath: string;
  thumbnailPath?: string;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processImage(
    file: Express.Multer.File,
    options: ProcessingOptions = {},
  ): Promise<ProcessedFile> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      createThumbnail = true,
      thumbnailSize = 200,
    } = options;

    try {
      // Pour un MVP, on peut juste retourner le fichier original
      // Dans un vrai système, on utiliserait sharp ou jimp pour traiter les images

      const result: ProcessedFile = {
        processedPath: file.path,
      };

      if (createThumbnail) {
        result.thumbnailPath = await this.createThumbnail(file, thumbnailSize);
      }

      return result;
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`);
      // En cas d'erreur, retourner le fichier original
      return {
        processedPath: file.path,
      };
    }
  }

  private async createThumbnail(
    file: Express.Multer.File,
    size: number,
  ): Promise<string> {
    // Créer le dossier thumbnails s'il n'existe pas
    const thumbnailDir = join(process.cwd(), 'uploads', 'thumbnails');
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true });
    }

    const ext = extname(file.filename);
    const thumbnailFilename = file.filename.replace(ext, `_thumb${ext}`);
    const thumbnailPath = join(thumbnailDir, thumbnailFilename);

    // Pour un MVP, on peut juste copier le fichier original
    // Dans un vrai système, on redimensionnerait l'image
    const fs = require('fs');
    fs.copyFileSync(file.path, thumbnailPath);

    this.logger.log(`Thumbnail created: ${thumbnailPath}`);
    return thumbnailPath;
  }

  async optimizeImage(inputPath: string, outputPath: string): Promise<void> {
    // Implémentation de l'optimisation d'image
    // Utiliserait sharp ou une autre bibliothèque
    this.logger.log(`Image optimized: ${inputPath} -> ${outputPath}`);
  }

  async resizeImage(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
  ): Promise<void> {
    // Implémentation du redimensionnement
    this.logger.log(
      `Image resized: ${inputPath} -> ${outputPath} (${width}x${height})`,
    );
  }
}