import { UserRole } from '../dto/auth.dto';

export interface JwtPayload {
  sub: string; // User ID
  role: UserRole; // Rôle contextuel
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  contextRole: UserRole;
  isActive: boolean;
}