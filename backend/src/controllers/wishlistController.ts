import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export async function getUserWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
      return;
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const properties = items.map((item) => item.property);

    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const { propertyId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
      return;
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
      return;
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_propertyId: { userId, propertyId },
      },
      update: {},
      create: {
        userId,
        propertyId,
      },
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const { propertyId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
      return;
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        propertyId,
      },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Property removed from wishlist' },
    });
  } catch (error) {
    next(error);
  }
}
