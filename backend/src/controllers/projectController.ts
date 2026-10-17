import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

const projectCategoryEnum = z.enum(['Construction', 'Renovation', 'Waterproofing', 'Fabrication', 'Earthworks']);
const projectStatusEnum = z.enum(['Completed', 'In Progress', 'Planning', 'Archived']);

const createProjectSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: projectCategoryEnum,
  location: z.string().min(2, 'Location is required'),
  status: projectStatusEnum.default('Completed'),
  description: z.string().min(5, 'Description is required'),
  image: z.string().min(1, 'Cover image is required'),
  beforeImage: z.string().optional(),
  afterImage: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

const updateProjectSchema = createProjectSchema.partial();

// ── Public Endpoints ──────────────────────────────────────────────────────────

export async function getPublicProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, status, featured, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (featured === 'true') where.featured = true;

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: projects,
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

export async function getPublicProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid project payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const project = await prisma.project.create({
      data: parsed.data,
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `created Project "${project.title}"`, 'Projects');
    }

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid project payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: parsed.data,
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `updated Project "${updated.title}"`, 'Projects');
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    await prisma.project.delete({ where: { id } });

    if (req.user?.id) {
      await logAudit(req.user.id, `deleted Project "${existing.title}"`, 'Projects');
    }

    res.status(200).json({
      success: true,
      data: { message: `Project "${existing.title}" deleted successfully.` },
    });
  } catch (error) {
    next(error);
  }
}
