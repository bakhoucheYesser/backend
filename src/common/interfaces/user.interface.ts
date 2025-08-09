import { UserRole } from '../enums/user-roles.enum';

export interface BaseUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientUser extends BaseUser {
  role: UserRole.CLIENT;
}

export interface ProviderUser extends BaseUser {
  role: UserRole.PROVIDER;
  providerProfile: {
    id: string;
    companyName: string;
    isVerified: boolean;
    rating?: number;
    totalJobs: number;
    vehicles: number;
  };
}

export interface DriverUser extends BaseUser {
  role: UserRole.DRIVER;
  driverProfile: {
    id: string;
    licenseNumber: string;
    rating?: number;
    totalTrips: number;
    isAvailable: boolean;
    provider?: string;
  };
}

export interface AdminUser extends BaseUser {
  role: UserRole.ADMIN;
}

export type AuthenticatedUser =
  | ClientUser
  | ProviderUser
  | DriverUser
  | AdminUser;
