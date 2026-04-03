import { UserRole } from '../../users/enums/user-role.enum';

export function hasRequiredRole(
  userRole: UserRole,
  requiredRoles: UserRole[],
): boolean {
  if (requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.includes(userRole);
}
