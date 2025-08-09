import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export class LoginDto {
  @ApiProperty({
    example: 'marie.client@email.com',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mot de passe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Contexte de rôle spécifique pour cette session (optionnel)'
  })
  @IsOptional()
  @IsEnum(UserRole)
  roleContext?: UserRole;
}

export class RegisterDto {
  @ApiProperty({ example: 'marie@email.com' })
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Tremblay' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Le nom ne doit contenir que des lettres, espaces, apostrophes et tirets',
  })
  nom: string;

  @ApiProperty({ example: 'Marie' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Le prénom ne doit contenir que des lettres, espaces, apostrophes et tirets',
  })
  prenom: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CLIENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}