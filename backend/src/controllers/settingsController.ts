import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

const updateSettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  logoUrl: z.string().default('/logo.svg'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email required'),
  address: z.string().min(1, 'Address is required'),
  whatsapp: z.string().default(''),
  whatsappCommunityUrl: z.string().default(''),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  footerTagline: z.string().default('Building with Integrity, Delivering with Excellence'),
});

// ── Public Endpoint ───────────────────────────────────────────────────────────

export async function getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      // Default fallback
      res.status(200).json({
        success: true,
        data: {
          companyName: 'Nestora',
          logoUrl: '/logo.svg',
          phone: '+91 98765 43210',
          email: 'info@nestora.com',
          address: 'Plot 42, Sector 5, Salt Lake, Kolkata 700091',
          whatsapp: '+91 98765 43210',
          whatsappCommunityUrl: 'https://chat.whatsapp.com/nestora',
          facebook: 'https://facebook.com/nestora',
          instagram: 'https://instagram.com/nestora',
          linkedin: 'https://linkedin.com/company/nestora',
          twitter: 'https://twitter.com/nestora',
          footerTagline: 'Building with Integrity, Delivering with Excellence',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          companyName: 'Nestora',
          logoUrl: '/logo.svg',
          phone: '+91 98765 43210',
          email: 'info@nestora.com',
          address: 'Plot 42, Sector 5, Salt Lake, Kolkata 700091',
          whatsapp: '+91 98765 43210',
          whatsappCommunityUrl: 'https://chat.whatsapp.com/nestora',
          footerTagline: 'Building with Integrity, Delivering with Excellence',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid settings payload',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const first = await prisma.settings.findFirst();

    let updated;
    if (first) {
      updated = await prisma.settings.update({
        where: { id: first.id },
        data: parsed.data,
      });
    } else {
      updated = await prisma.settings.create({
        data: parsed.data,
      });
    }

    if (req.user?.id) {
      await logAudit(req.user.id, 'updated Business Settings', 'Settings');
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
