import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/, {
    message: 'estimateId must be a valid ID format',
  })
  estimateId: string;

  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @IsNotEmpty()
  @IsPhoneNumber('CA') // Format canadien
  customerPhone: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  itemsDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalContacts?: string[];
}

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsPhoneNumber('CA')
  customerPhone?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  itemsDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

export class TimeSlotQueryDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;
}

export class BookingResponseDto {
  id: string;
  estimateId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  scheduledAt: Date;
  status: BookingStatus;
  itemsDescription?: string;
  photoUrls?: string[];
  specialInstructions?: string;
  estimate?: any;
  createdAt: Date;
  updatedAt: Date;
}
