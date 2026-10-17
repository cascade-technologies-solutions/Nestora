import { Router } from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/settingsController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const publicSettingsRouter = Router();
publicSettingsRouter.get('/', getPublicSettings);

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth, requirePermission('manage:settings'));
adminSettingsRouter.get('/', getAdminSettings);
adminSettingsRouter.put('/', updateAdminSettings);
