import { Injectable, BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import * as crypto from 'crypto';

@Injectable()
export class FileValidationService {
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  async validateFile(file: Express.Multer.File): Promise<void> {
    // 1. Vérifier la taille
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 5MB)');
    }

    // 2. Vérifier l'extension
    const ext = this.getFileExtension(file.originalname);
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('Extension de fichier non autorisée');
    }

    // 3. Vérifier le MIME type déclaré
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé');
    }

    // 4. Vérifier le MIME type réel du contenu (magic bytes)
    try {
      const fileType = await fileTypeFromBuffer(file.buffer);
      if (!fileType || !this.ALLOWED_MIME_TYPES.includes(fileType.mime)) {
        throw new BadRequestException('Le contenu du fichier ne correspond pas à son extension');
      }
    } catch (error) {
      throw new BadRequestException('Impossible de valider le type de fichier');
    }
  }

  generateSecureFilename(originalName: string): string {
    const ext = this.getFileExtension(originalName);
    const randomName = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomName}${ext}`;
  }

  private getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }
}