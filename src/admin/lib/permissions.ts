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

const ROLE_PERMISSIONS: Record<EmployeeRoleType, Permission[]> = {
  'Super Admin': Object.values(PERMISSIONS),
  'Admin': [
    PERMISSIONS.MANAGE_PROPERTIES,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.MANAGE_ENQUIRIES,
    PERMISSIONS.MANAGE_MEDIA,
    PERMISSIONS.MANAGE_CMS,
  ],
};

/**
 * Check if a specific role has a given permission.
 */
export function hasPermission(role: EmployeeRoleType | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Assert that a role has a specific permission, throwing an error if not.
 * Useful for repository layer checks.
 */
export function assertPermission(role: EmployeeRoleType | undefined | null, permission: Permission, actionDescription: string = 'perform this action'): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Access Denied: You do not have permission to ${actionDescription}.`);
  }
}
