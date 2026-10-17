import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

// ── Property Schemas ─────────────────────────────────────────────────────────

const propertyStatusEnum = z.enum([
  'draft',
  'published',
  'under_negotiation',
  'sold',
  'rented',
  'archived',
]);

const propertyTypeEnum = z.enum(['For Sale', 'For Rent']);
const propertyCategoryEnum = z.enum(['Residential', 'Commercial', 'Plots & Land']);

const createPropertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  price: z.string().min(1, 'Price is required'),
  address: z.string().min(3, 'Address is required'),
  beds: z.coerce.number().min(0).default(0),
  baths: z.coerce.number().min(0).default(0),
  sqft: z.coerce.number().min(0).default(0),
  type: propertyTypeEnum,
  category: propertyCategoryEnum,
  isNew: z.boolean().default(false),
  image: z.string().min(1, 'Cover image URL is required'),
  gallery: z.array(z.string()).default([]),
  status: propertyStatusEnum.default('draft'),
  featured: z.boolean().default(false),
  assignedAdmin: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

// ── Helper: Generate Next Property Code (NST-###) ─────────────────────────────

async function generateNextPropertyCode(): Promise<string> {
  const latest = await prisma.property.findFirst({
    where: { propertyCode: { startsWith: 'NST-' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) {
    return 'NST-101';
  }

  const match = latest.propertyCode.match(/NST-(\d+)/);
  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `NST-${nextNum}`;
  }

  const count = await prisma.property.count();
  return `NST-${101 + count}`;
}

// ── Public Endpoints ──────────────────────────────────────────────────────────

export async function getPublicProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, category, featured, search, page = '1', limit = '12' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'published', // Public site ONLY sees published properties
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (featured === 'true') where.featured = true;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { propertyCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: properties,
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

export async function getPublicPropertyById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { propertyCode: id }],
      },
    });

    if (!property) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, type, category, featured, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.category = category;
    if (featured === 'true') where.featured = true;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { propertyCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: properties,
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

export async function createProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createPropertySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid property payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const propertyCode = await generateNextPropertyCode();
    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        propertyCode,
      },
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `created Property ${property.propertyCode} ("${property.title}")`, 'Properties');
    }

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updatePropertySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid property payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
      return;
    }

    const updated = await prisma.property.update({
      where: { id },
      data: parsed.data,
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `updated Property ${updated.propertyCode} ("${updated.title}")`, 'Properties');
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
      return;
    }

    await prisma.property.delete({ where: { id } });

    if (req.user?.id) {
      await logAudit(req.user.id, `deleted Property ${existing.propertyCode} ("${existing.title}")`, 'Properties');
    }

    res.status(200).json({
      success: true,
      data: { message: `Property ${existing.propertyCode} deleted successfully.` },
    });
  } catch (error) {
    next(error);
  }
}

export async function setPropertyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const parsedStatus = propertyStatusEnum.safeParse(status);
    if (!parsedStatus.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid property status' },
      });
      return;
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { status: parsedStatus.data },
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `changed status of Property ${updated.propertyCode} to ${updated.status}`, 'Properties');
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function setPropertyFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    if (typeof featured !== 'boolean') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'featured must be a boolean' },
      });
      return;
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { featured },
    });

    if (req.user?.id) {
      await logAudit(
        req.user.id,
        `${featured ? 'featured' : 'unfeatured'} Property ${updated.propertyCode}`,
        'Properties'
      );
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
