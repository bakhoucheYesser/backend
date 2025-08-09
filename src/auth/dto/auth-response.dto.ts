import { UserRole } from './auth.dto';

export interface ProviderProfileData {
  id: string;
  companyName: string;
  isVerified: boolean;
  rating?: number;
  totalJobs: number;
  vehicles: number;
}

export interface DriverProfileData {
  id: string;
  licenseNumber: string;
  rating?: number;
  totalTrips: number;
  isAvailable: boolean;
  provider?: string;
}

export class UserProfileDto {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;

  // Propriétés conditionnelles selon le rôle
  provider?: ProviderProfileData;
  driver?: DriverProfileData;
}

export class AuthResponseDto {
  user: UserProfileDto;
  accessToken?: string;
  message?: string;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
