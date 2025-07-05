import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ImageProcessingService } from './services/image-processing.service';
import { StorageService } from './services/storage.service';
import { multerConfig } from './config/multer.config';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => multerConfig,
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, ImageProcessingService, StorageService],
  exports: [UploadService],
})
export class UploadModule {}
