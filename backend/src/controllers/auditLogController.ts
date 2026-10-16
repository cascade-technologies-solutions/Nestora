import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export async function getAdminAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { module, employeeId, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (module) where.module = module;
    if (employeeId) where.employeeId = employeeId;

    if (search && typeof search === 'string' && search.trim()) {
      where.action = { contains: search.trim(), mode: 'insensitive' };
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          employee: {
            select: { id: true, name: true, username: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    // Format logs with user display name compatible with frontend ActivityLog format
    const formatted = logs.map((log) => ({
      id: log.id,
      user: log.employee ? `${log.employee.name} (@${log.employee.username})` : 'System',
      action: log.action,
      module: log.module,
      timestamp: log.timestamp.toISOString(),
      employeeId: log.employeeId,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}
