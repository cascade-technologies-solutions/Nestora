import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/authService';
import { prisma } from '../utils/prisma';

export const ALL_PERMISSIONS = [
  'manage:employees',
  'manage:settings',
  'manage:properties',
  'manage:projects',
  'manage:services',
  'manage:enquiries',
  'manage:media',
  'manage:cms',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export interface AuthenticatedUser {
  id: string;
  role: string;
  type: 'admin' | 'public';
  username?: string;
  email?: string;
  name: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function computeEffectivePermissions(role: string, employeePermissions: { permission: string; granted: boolean }[]): string[] {
  if (role === 'Super Admin') {
    return [...ALL_PERMISSIONS];
  }

  if (role === 'Admin') {
    return [
      'manage:properties',
      'manage:projects',
      'manage:services',
      'manage:enquiries',
      'manage:media',
      'manage:cms',
    ];
  }

  // Employee: custom overrides from EmployeePermission table
  const granted = new Set<string>();
  for (const p of employeePermissions) {
    if (p.granted) {
      granted.add(p.permission);
    }
  }
  return Array.from(granted);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication token required.',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    let decoded: TokenPayload;

    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID_OR_EXPIRED',
          message: 'Your session has expired or is invalid. Please log in again.',
        },
      });
      return;
    }

    if (decoded.type === 'admin') {
      const employee = await prisma.employee.findUnique({
        where: { id: decoded.id },
        include: { permissions: true },
      });

      if (!employee || employee.status !== 'Active') {
        res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Your account is inactive or has been suspended.',
          },
        });
        return;
      }

      const effectivePermissions = computeEffectivePermissions(employee.role, employee.permissions);

      req.user = {
        id: employee.id,
        role: employee.role,
        type: 'admin',
        username: employee.username,
        name: employee.name,
        permissions: effectivePermissions,
      };
    } else {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found.',
          },
        });
        return;
      }

      req.user = {
        id: user.id,
        role: 'User',
        type: 'public',
        email: user.email,
        name: user.name,
        permissions: [],
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (req.user.type !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Administrative privileges required.',
        },
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access Denied: You do not have permission to ${permission}.`,
        },
      });
      return;
    }

    next();
  };
}
