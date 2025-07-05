import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';

export enum FileCategory {
  ITEM_PHOTO = 'item_photo',
  RECEIPT = 'receipt',
  DOCUMENT = 'document',
  PROFILE = 'profile',
}

export class UploadMetadataDto {
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsUUID()
  estimateId?: string;
}

export class FileResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category?: FileCategory;
  description?: string;
  uploadedAt: Date;
}

export class BulkUploadResponseDto {
  success: FileResponseDto[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
}