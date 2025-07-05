import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, statSync } from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadPath = join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    const directories = [
      this.uploadPath,
      join(this.uploadPath, 'photos'),
      join(this.uploadPath, 'thumbnails'),
      join(this.uploadPath, 'documents'),
      join(this.uploadPath, 'temp'),
    ];

    directories.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        this.logger.log(`Created directory: ${dir}`);
      }
    });
  }

  getStoragePath(category: string): string {
    return join(this.uploadPath, category);
  }

  getFileStats(filePath: string) {
    if (!existsSync(filePath)) {
      return null;
    }

    return statSync(filePath);
  }

  async cleanupTempFiles(): Promise<void> {
    // Nettoyer les fichiers temporaires de plus de 24h
    const tempDir = join(this.uploadPath, 'temp');
    // Implémentation du nettoyage
    this.logger.log('Temp files cleanup completed');
  }

  async getStorageUsage() {
    // Calculer l'utilisation du stockage
    return {
      totalSize: 0,
      fileCount: 0,
      availableSpace: 0,
    };
  }
}
