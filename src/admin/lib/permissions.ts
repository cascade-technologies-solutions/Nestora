import { EmployeeRoleType } from '../types/admin';

export const PERMISSIONS = {
  MANAGE_EMPLOYEES: 'manage:employees',
  MANAGE_SETTINGS: 'manage:settings',
  MANAGE_PROPERTIES: 'manage:properties',
  MANAGE_PROJECTS: 'manage:projects',
  MANAGE_SERVICES: 'manage:services',
  MANAGE_ENQUIRIES: 'manage:enquiries',
  MANAGE_MEDIA: 'manage:media',
  MANAGE_CMS: 'manage:cms',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<EmployeeRoleType, Permission[]> = {
  'Super Admin': Object.values(PERMISSIONS),
  'Admin': [
    PERMISSIONS.MANAGE_PROPERTIES,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.MANAGE_ENQUIRIES,
    PERMISSIONS.MANAGE_MEDIA,
    PERMISSIONS.MANAGE_CMS,
  ],
  'Employee': [],
};

/**
 * Check if a specific role or user has a given permission.
 * If userPermissions array is passed (from /auth/me or session), it is checked directly.
 */
export function hasPermission(
  role: EmployeeRoleType | undefined | null,
  permission: Permission,
  userPermissions?: string[]
): boolean {
  if (!role) return false;
  if (role === 'Super Admin') return true;
  if (Array.isArray(userPermissions) && userPermissions.length > 0) {
    return userPermissions.includes(permission);
  }
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Assert that a role has a specific permission, throwing an error if not.
 */
export function assertPermission(
  role: EmployeeRoleType | undefined | null,
  permission: Permission,
  actionDescription: string = 'perform this action',
  userPermissions?: string[]
): void {
  if (!hasPermission(role, permission, userPermissions)) {
    throw new Error(`Access Denied: You do not have permission to ${actionDescription}.`);
  }
}
