import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

const createServiceSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  icon: z.string().default('Home'),
  color: z.string().default('bg-blue-500/10 text-blue-500'),
  enabled: z.boolean().default(true),
  order: z.coerce.number().default(0),
  image: z.string().optional(),
  workTypes: z.array(z.string()).default([]),
});

const updateServiceSchema = createServiceSchema.partial();

// ── Public Endpoints ──────────────────────────────────────────────────────────

export async function getPublicServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const services = await prisma.service.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const services = await prisma.service.findMany({
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
}

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid service payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const service = await prisma.service.create({
      data: parsed.data,
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `created Service "${service.title}"`, 'Services');
    }

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid service payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service not found' },
      });
      return;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `updated Service "${updated.title}"`, 'Services');
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service not found' },
      });
      return;
    }

    await prisma.service.delete({ where: { id } });

    if (req.user?.id) {
      await logAudit(req.user.id, `deleted Service "${existing.title}"`, 'Services');
    }

    res.status(200).json({
      success: true,
      data: { message: `Service "${existing.title}" deleted successfully.` },
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderIds } = req.body; // array of service IDs in desired order
    if (!Array.isArray(orderIds)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderIds must be an array of IDs' },
      });
      return;
    }

    await Promise.all(
      orderIds.map((id, index) =>
        prisma.service.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    if (req.user?.id) {
      await logAudit(req.user.id, 'reordered Services', 'Services');
    }

    res.status(200).json({
      success: true,
      data: { message: 'Services reordered successfully.' },
    });
  } catch (error) {
    next(error);
  }
}
