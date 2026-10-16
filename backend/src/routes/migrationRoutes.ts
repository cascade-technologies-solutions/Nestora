import { Router } from 'express';
import { migrationController } from '../controllers/migrationController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const adminMigrationRouter = Router();

// Only Super Admin ('manage:settings') can export or import full database migrations
adminMigrationRouter.use(requireAuth, requirePermission('manage:settings'));

adminMigrationRouter.get('/export', migrationController.exportDatabase);
adminMigrationRouter.post('/import', migrationController.importData);
