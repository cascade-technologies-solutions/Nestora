import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';
import { ALL_PERMISSIONS } from '../middleware/authMiddleware';

const employeeRoleEnum = z.enum(['Super Admin', 'Admin', 'Employee']);
const employeeStatusEnum = z.enum(['Active', 'Suspended', 'Deactivated']);

const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'Employee']),
  permissions: z.array(z.string()).optional(),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['Super Admin', 'Admin', 'Employee']).optional(),
});

// ── Admin Endpoints (manage:employees — Super Admin Only) ──────────────────────

export async function getAdminEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        permissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = employees.map(({ passwordHash: _, ...rest }) => rest);

    res.status(200).json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid employee data',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { name, username, password, role, permissions = [] } = parsed.data;
    const cleanUsername = username.trim().toLowerCase();

    // Check unique username
    const existing = await prisma.employee.findFirst({
      where: { username: { equals: cleanUsername, mode: 'insensitive' } },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_USERNAME', message: `Username "${cleanUsername}" is already taken.` },
      });
      return;
    }

    // Limit of max 2 active/suspended Admins
    if (role === 'Admin') {
      const adminCount = await prisma.employee.count({
        where: {
          role: 'Admin',
          status: { in: ['Active', 'Suspended'] },
        },
      });
      if (adminCount >= 2) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ADMIN_LIMIT_REACHED',
            message: 'Maximum limit of 2 active or suspended Admin accounts has been reached.',
          },
        });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        passwordHash,
        role,
        status: 'Active',
      },
    });

    // Create permission overrides if employee
    if (role === 'Employee' && permissions.length > 0) {
      await prisma.employeePermission.createMany({
        data: permissions
          .filter((p) => ALL_PERMISSIONS.includes(p as any))
          .map((p) => ({
            employeeId: employee.id,
            permission: p,
            granted: true,
          })),
      });
    }

    if (req.user?.id) {
      await logAudit(req.user.id, `created Employee ${employee.name} (${employee.role})`, 'Employees');
    }

    const { passwordHash: _, ...sanitized } = employee;

    res.status(201).json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' },
      });
      return;
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee not found' },
      });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: parsed.data,
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `updated Employee details for ${updated.name}`, 'Employees');
    }

    const { passwordHash: _, ...sanitized } = updated;

    res.status(200).json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
}

export async function setEmployeeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const parsedStatus = employeeStatusEnum.safeParse(status);
    if (!parsedStatus.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid status' },
      });
      return;
    }

    // Protection: Cannot suspend or deactivate self
    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        error: { code: 'OPERATION_NOT_ALLOWED', message: 'You cannot change your own account status.' },
      });
      return;
    }

    // Protection: Cannot deactivate last active Super Admin
    const target = await prisma.employee.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee not found' },
      });
      return;
    }

    if (target.role === 'Super Admin' && parsedStatus.data !== 'Active') {
      const activeSuperCount = await prisma.employee.count({
        where: { role: 'Super Admin', status: 'Active' },
      });
      if (activeSuperCount <= 1) {
        res.status(400).json({
          success: false,
          error: { code: 'OPERATION_NOT_ALLOWED', message: 'Cannot deactivate or suspend the only active Super Admin.' },
        });
        return;
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { status: parsedStatus.data },
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `changed status of Employee ${updated.name} to ${updated.status}`, 'Employees');
    }

    res.status(200).json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetEmployeePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters.' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const employee = await prisma.employee.update({
      where: { id },
      data: { passwordHash },
    });

    // Invalidate existing sessions for this employee
    await prisma.refreshToken.updateMany({
      where: { employeeId: id },
      data: { revokedAt: new Date() },
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `reset password for Employee ${employee.name}`, 'Employees');
    }

    res.status(200).json({
      success: true,
      data: { message: `Password reset successfully for ${employee.name}.` },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // array of permission strings

    if (!Array.isArray(permissions)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'permissions must be an array of strings' },
      });
      return;
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee not found' },
      });
      return;
    }

    // Replace permissions
    await prisma.$transaction([
      prisma.employeePermission.deleteMany({ where: { employeeId: id } }),
      prisma.employeePermission.createMany({
        data: permissions
          .filter((p) => ALL_PERMISSIONS.includes(p as any))
          .map((p) => ({
            employeeId: id,
            permission: p,
            granted: true,
          })),
      }),
    ]);

    if (req.user?.id) {
      await logAudit(req.user.id, `updated permissions for Employee ${employee.name}`, 'Employees');
    }

    const updatedPermissions = await prisma.employeePermission.findMany({
      where: { employeeId: id },
    });

    res.status(200).json({
      success: true,
      data: {
        employeeId: id,
        permissions: updatedPermissions.map((p) => p.permission),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        error: { code: 'OPERATION_NOT_ALLOWED', message: 'You cannot delete your own account.' },
      });
      return;
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee not found' },
      });
      return;
    }

    if (employee.role === 'Super Admin') {
      const superCount = await prisma.employee.count({ where: { role: 'Super Admin' } });
      if (superCount <= 1) {
        res.status(400).json({
          success: false,
          error: { code: 'OPERATION_NOT_ALLOWED', message: 'Cannot delete the only Super Admin.' },
        });
        return;
      }
    }

    await prisma.$transaction([
      prisma.employeePermission.deleteMany({ where: { employeeId: id } }),
      prisma.refreshToken.deleteMany({ where: { employeeId: id } }),
      prisma.auditLog.deleteMany({ where: { employeeId: id } }),
      prisma.employee.delete({ where: { id } }),
    ]);

    if (req.user?.id) {
      await logAudit(req.user.id, `deleted Employee account for ${employee.name}`, 'Employees');
    }

    res.status(200).json({
      success: true,
      data: { message: `Employee ${employee.name} deleted successfully.` },
    });
  } catch (error) {
    next(error);
  }
}
