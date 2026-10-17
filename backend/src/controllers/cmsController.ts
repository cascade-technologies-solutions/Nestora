import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

// ── Public Endpoints ──────────────────────────────────────────────────────────

export async function getPublicCmsSection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { section } = req.params;
    const cmsSection = await prisma.cmsSection.findUnique({
      where: { section: section.toLowerCase().trim() },
    });

    if (!cmsSection) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `CMS section "${section}" not found` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cmsSection.content,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllPublicCmsSections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sections = await prisma.cmsSection.findMany();
    const map: Record<string, any> = {};
    for (const s of sections) {
      map[s.section] = s.content;
    }

    res.status(200).json({
      success: true,
      data: map,
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminCmsSection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { section } = req.params;
    const cmsSection = await prisma.cmsSection.findUnique({
      where: { section: section.toLowerCase().trim() },
    });

    if (!cmsSection) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `CMS section "${section}" not found` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cmsSection,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminCmsSection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { section } = req.params;
    const content = req.body;

    if (!content || typeof content !== 'object') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid JSON content is required' },
      });
      return;
    }

    const secKey = section.toLowerCase().trim();
    const updated = await prisma.cmsSection.upsert({
      where: { section: secKey },
      update: { content },
      create: { section: secKey, content },
    });

    if (req.user?.id) {
      await logAudit(req.user.id, `updated Website CMS section "${secKey}"`, 'Website CMS');
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateAdminCmsSections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sections } = req.body; // { hero: {...}, about: {...}, contact: {...} }

    if (!sections || typeof sections !== 'object') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'sections object is required' },
      });
      return;
    }

    const updatedKeys: string[] = [];

    await prisma.$transaction(
      Object.entries(sections).map(([sectionKey, content]) => {
        const secKey = sectionKey.toLowerCase().trim();
        updatedKeys.push(secKey);
        return prisma.cmsSection.upsert({
          where: { section: secKey },
          update: { content: content as any },
          create: { section: secKey, content: content as any },
        });
      })
    );

    if (req.user?.id) {
      await logAudit(
        req.user.id,
        `bulk updated Website CMS sections: [${updatedKeys.join(', ')}]`,
        'Website CMS'
      );
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'All modified CMS sections saved successfully.',
        updatedSections: updatedKeys,
      },
    });
  } catch (error) {
    next(error);
  }
}
