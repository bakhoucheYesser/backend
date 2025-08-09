import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from './auth.dto';

export class ClientRegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  nom: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  prenom: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class ProviderRegisterDto extends ClientRegisterDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  baseAddress: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  insuranceNumber?: string;
}

export class DriverRegisterDto extends ClientRegisterDto {
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @IsNotEmpty()
  @IsString()
  licenseExpiry: string;

  @IsOptional()
  @IsString()
  experienceYears?: string;
}
