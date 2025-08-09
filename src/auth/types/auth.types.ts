import { UserRole } from '../dto/auth.dto';
import { UserProfileDto } from '../dto/auth-response.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  providerProfile?: any;
  driverProfile?: any;
}

export interface AuthResult {
  user: UserProfileDto; // ✅ Utilise maintenant le bon type
  tokens?: TokenPair;
  message?: string;
}