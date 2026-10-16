import { Router } from 'express';
import {
  getPublicCmsSection,
  getAllPublicCmsSections,
  getAdminCmsSection,
  updateAdminCmsSection,
  bulkUpdateAdminCmsSections,
} from '../controllers/cmsController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const publicCmsRouter = Router();
publicCmsRouter.get('/', getAllPublicCmsSections);
publicCmsRouter.get('/:section', getPublicCmsSection);

export const adminCmsRouter = Router();
adminCmsRouter.use(requireAuth, requirePermission('manage:cms'));
adminCmsRouter.put('/bulk-update', bulkUpdateAdminCmsSections);
adminCmsRouter.get('/:section', getAdminCmsSection);
adminCmsRouter.put('/:section', updateAdminCmsSection);
