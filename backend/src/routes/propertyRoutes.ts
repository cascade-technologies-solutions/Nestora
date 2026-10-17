import { Router } from 'express';
import {
  getPublicProperties,
  getPublicPropertyById,
  getAdminProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  setPropertyStatus,
  setPropertyFeatured,
} from '../controllers/propertyController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const publicPropertyRouter = Router();
publicPropertyRouter.get('/', getPublicProperties);
publicPropertyRouter.get('/:id', getPublicPropertyById);

export const adminPropertyRouter = Router();
adminPropertyRouter.use(requireAuth, requirePermission('manage:properties'));
adminPropertyRouter.get('/', getAdminProperties);
adminPropertyRouter.post('/', createProperty);
adminPropertyRouter.put('/:id', updateProperty);
adminPropertyRouter.delete('/:id', deleteProperty);
adminPropertyRouter.patch('/:id/status', setPropertyStatus);
adminPropertyRouter.patch('/:id/featured', setPropertyFeatured);
