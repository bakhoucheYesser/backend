import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

// Créer le dossier uploads s'il n'existe pas
const uploadPath = join(process.cwd(), 'uploads');
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

// Configuration stricte
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Organiser par date pour éviter trop de fichiers dans un dossier
      const date = new Date().toISOString().split('T')[0];
      const uploadPath = join(process.cwd(), 'uploads', 'photos', date);
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Nom de fichier cryptographiquement sécurisé
      const ext = extname(file.originalname).toLowerCase();
      const uniqueName = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      cb(null, `${timestamp}-${uniqueName}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();

    // Double validation: extension ET MIME type
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new BadRequestException('Extension de fichier non autorisée'),
        false,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestException('Type MIME non autorisé'), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
    fieldNameSize: 50,
    fieldSize: 1024 * 100,
    parts: 10,
  },
};