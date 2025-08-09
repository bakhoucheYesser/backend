export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 4,
  [UserRole.PROVIDER]: 3,
  [UserRole.DRIVER]: 2,
  [UserRole.CLIENT]: 1,
};

export function hasHigherRole(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
