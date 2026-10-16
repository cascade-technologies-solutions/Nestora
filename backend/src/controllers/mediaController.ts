import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';
import { deleteLocalFile, getPublicUrl } from '../services/storageService';

// ── Check if media URL is referenced in website content ───────────────────────

async function findAssetReferences(assetUrl: string): Promise<string[]> {
  const references: string[] = [];

  // Check Properties
  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { image: assetUrl },
        { gallery: { has: assetUrl } },
      ],
    },
    select: { propertyCode: true, title: true },
  });
  for (const p of properties) {
    references.push(`Property ${p.propertyCode} (${p.title})`);
  }

  // Check Projects
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { image: assetUrl },
        { beforeImage: assetUrl },
        { afterImage: assetUrl },
        { gallery: { has: assetUrl } },
      ],
    },
    select: { title: true },
  });
  for (const p of projects) {
    references.push(`Project "${p.title}"`);
  }

  // Check Services
  const services = await prisma.service.findMany({
    where: { image: assetUrl },
    select: { title: true },
  });
  for (const s of services) {
    references.push(`Service "${s.title}"`);
  }

  return references;
}

// ── Upload Media ─────────────────────────────────────────────────────────────

export async function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const singleFile = req.file;

    const allFiles: Express.Multer.File[] = [];
    if (files && Array.isArray(files)) {
      allFiles.push(...files);
    } else if (singleFile) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILES_UPLOADED', message: 'No image file was uploaded' },
      });
      return;
    }

    const uploadedAssets: any[] = [];
    let savedFolder = 'general';

    for (const file of allFiles) {
      const actualFolder = path.basename(file.destination) || 'general';
      savedFolder = actualFolder;
      const url = getPublicUrl(actualFolder, file.filename);
      const asset = await prisma.mediaAsset.create({
        data: {
          name: file.originalname,
          url,
          size: file.size,
          mimeType: file.mimetype,
          folder: actualFolder,
          uploadedById: req.user?.id,
        },
      });
      uploadedAssets.push(asset);
    }

    await logAudit({
      employeeId: req.user?.id,
      action: `uploaded ${uploadedAssets.length} image file(s) to folder "${savedFolder}"`,
      module: 'Media Library',
    });

    res.status(201).json({
      success: true,
      data: uploadedAssets.length === 1 ? uploadedAssets[0] : uploadedAssets,
    });
  } catch (error) {
    next(error);
  }
}

// ── Get Media Assets ─────────────────────────────────────────────────────────

export async function getMediaAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { folder, search, page = '1', limit = '50', sort = 'desc' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (folder && folder !== 'all') {
      where.folder = folder as string;
    }
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: assets,
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

// ── Rename Media Asset ───────────────────────────────────────────────────────

export async function renameMediaAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Valid file name is required' },
      });
      return;
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Media asset not found' },
      });
      return;
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { name: name.trim() },
    });

    await logAudit({
      employeeId: req.user?.id,
      action: `renamed media asset "${asset.name}" to "${name.trim()}"`,
      module: 'Media Library',
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ── Replace Media Asset ──────────────────────────────────────────────────────

export async function replaceMediaAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'New image file is required for replacement' },
      });
      return;
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Media asset not found' },
      });
      return;
    }

    const oldUrl = asset.url;
    const folder = asset.folder || 'general';
    const newUrl = getPublicUrl(folder, file.filename);

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: {
        name: file.originalname,
        url: newUrl,
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    // Unlink old file from disk
    await deleteLocalFile(oldUrl);

    await logAudit({
      employeeId: req.user?.id,
      action: `replaced media asset "${asset.name}" with new file "${file.originalname}"`,
      module: 'Media Library',
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ── Delete Media Asset ───────────────────────────────────────────────────────

export async function deleteMediaAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Media asset not found' },
      });
      return;
    }

    // Check for references if not forced
    const references = await findAssetReferences(asset.url);
    if (references.length > 0 && !force) {
      res.status(409).json({
        success: false,
        error: {
          code: 'REFERENCED_ASSET',
          message: 'Asset is currently used in active website content. Use ?force=true to delete anyway.',
          references,
        },
      });
      return;
    }

    // Unlink physical file from disk
    await deleteLocalFile(asset.url);

    // Delete database record
    await prisma.mediaAsset.delete({ where: { id } });

    await logAudit({
      employeeId: req.user?.id,
      action: `deleted media asset "${asset.name}" (${asset.url})`,
      module: 'Media Library',
    });

    res.status(200).json({
      success: true,
      data: { message: 'Asset deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
}

// ── Bulk Delete Media Assets ─────────────────────────────────────────────────

export async function bulkDeleteMediaAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids, force = false } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_IDS', message: 'Array of media asset IDs is required' },
      });
      return;
    }

    const assets = await prisma.mediaAsset.findMany({
      where: { id: { in: ids } },
    });

    const deletedIds: string[] = [];
    const skipped: { id: string; name: string; references: string[] }[] = [];

    for (const asset of assets) {
      const references = await findAssetReferences(asset.url);
      if (references.length > 0 && !force) {
        skipped.push({ id: asset.id, name: asset.name, references });
        continue;
      }

      await deleteLocalFile(asset.url);
      await prisma.mediaAsset.delete({ where: { id: asset.id } });
      deletedIds.push(asset.id);
    }

    await logAudit({
      employeeId: req.user?.id,
      action: `bulk deleted ${deletedIds.length} media assets`,
      module: 'Media Library',
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: deletedIds.length,
        deletedIds,
        skippedCount: skipped.length,
        skipped,
      },
    });
  } catch (error) {
    next(error);
  }
}
