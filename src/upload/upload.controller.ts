import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UploadMetadataDto,
  FileResponseDto,
  BulkUploadResponseDto,
  FileCategory,
} from './dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Upload d'un seul fichier
  @Public()
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif|webp)' }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() metadata: UploadMetadataDto,
  ): Promise<FileResponseDto> {
    return this.uploadService.uploadSingle(file, metadata);
  }

  // Upload de plusieurs fichiers
  @Public()
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 fichiers
  async uploadMultiple(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif|webp)' }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Body() metadata: UploadMetadataDto,
  ): Promise<BulkUploadResponseDto> {
    return this.uploadService.uploadMultiple(files, metadata);
  }

  // Upload spécifique pour photos d'items (pour booking)
  @Public()
  @Post('photos/items')
  @UseInterceptors(FilesInterceptor('photos', 5)) // Max 5 photos d'items
  async uploadItemPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('bookingId') bookingId?: string,
    @Body('estimateId') estimateId?: string,
    @Body('description') description?: string,
  ): Promise<BulkUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const metadata: UploadMetadataDto = {
      category: FileCategory.ITEM_PHOTO,
      bookingId,
      estimateId,
      description,
    };

    return this.uploadService.uploadMultiple(files, metadata);
  }

  // Obtenir les informations d'un fichier
  @Get('files/:id')
  async getFile(@Param('id') id: string): Promise<FileResponseDto> {
    return this.uploadService.getFileInfo(id);
  }

  // Servir un fichier (téléchargement)
  @Public()
  @Get('serve/:filename')
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,  // ✅ FIXED: Moved required parameter before optional ones
    @Query('thumbnail') thumbnail?: string,
  ) {
    const filePath = await this.uploadService.getFilePath(
      filename,
      thumbnail === 'true',
    );
    return res.sendFile(filePath);
  }

  // Supprimer un fichier
  @Delete('files/:id')
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    await this.uploadService.deleteFile(id);
    return { message: 'File deleted successfully' };
  }

  // Obtenir tous les fichiers d'un booking
  @Get('booking/:bookingId/files')
  async getBookingFiles(
    @Param('bookingId') bookingId: string,
  ): Promise<FileResponseDto[]> {
    return this.uploadService.getFilesByBooking(bookingId);
  }

  // Obtenir tous les fichiers d'une estimation
  @Public()
  @Get('estimate/:estimateId/files')
  async getEstimateFiles(
    @Param('estimateId') estimateId: string,
  ): Promise<FileResponseDto[]> {
    return this.uploadService.getFilesByEstimate(estimateId);
  }

  // Endpoint pour vérifier l'espace de stockage disponible
  @Get('storage/info')
  async getStorageInfo() {
    return this.uploadService.getStorageInfo();
  }
}