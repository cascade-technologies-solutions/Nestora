import { Router } from 'express';
import {
  getPublicServices,
  getAdminServices,
  createService,
  updateService,
  deleteService,
  reorderServices,
} from '../controllers/serviceController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const publicServiceRouter = Router();
publicServiceRouter.get('/', getPublicServices);

export const adminServiceRouter = Router();
adminServiceRouter.use(requireAuth, requirePermission('manage:services'));
adminServiceRouter.get('/', getAdminServices);
adminServiceRouter.post('/', createService);
adminServiceRouter.put('/:id', updateService);
adminServiceRouter.delete('/:id', deleteService);
adminServiceRouter.patch('/reorder', reorderServices);
