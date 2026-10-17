import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

const enquiryTypeEnum = z.enum(['contact', 'property', 'service']);
const enquiryStatusEnum = z.enum(['New', 'Contacted', 'Site Visit', 'Negotiation', 'Closed']);
const enquiryPriorityEnum = z.enum(['Low', 'Medium', 'High']);

const createEnquirySchema = z.object({
  type: enquiryTypeEnum.default('contact'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(6, 'Valid phone number required'),
  message: z.string().min(3, 'Message is required'),
  propertyId: z.string().optional(),
  serviceId: z.string().optional(),
});

const updateEnquirySchema = z.object({
  status: enquiryStatusEnum.optional(),
  priority: enquiryPriorityEnum.optional(),
  assignedTo: z.string().optional(),
  internalNotes: z.string().optional(),
  followUpDate: z.string().optional(),
});

// ── Public Endpoint ───────────────────────────────────────────────────────────

export async function submitPublicEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createEnquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid enquiry submission',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        ...parsed.data,
        status: 'New',
        priority: 'Medium',
        internalNotes: '',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: enquiry.id,
        message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminEnquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, priority, type, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, enquiries] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: enquiries,
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

export async function getAdminEnquiryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const enquiry = await prisma.enquiry.findUnique({ where: { id } });

    if (!enquiry) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Enquiry not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateEnquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid update data',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Enquiry not found' },
      });
      return;
    }

    const dataToUpdate: any = { ...parsed.data };
    if (parsed.data.followUpDate) {
      dataToUpdate.followUpDate = new Date(parsed.data.followUpDate);
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: dataToUpdate,
    });

    if (req.user?.id) {
      await logAudit(
        req.user.id,
        `updated Enquiry from ${updated.name} (Status: ${updated.status})`,
        'Enquiries'
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

export async function deleteAdminEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Enquiry not found' },
      });
      return;
    }

    await prisma.enquiry.delete({ where: { id } });

    if (req.user?.id) {
      await logAudit(req.user.id, `deleted Enquiry from ${existing.name}`, 'Enquiries');
    }

    res.status(200).json({
      success: true,
      data: { message: 'Enquiry deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
}
