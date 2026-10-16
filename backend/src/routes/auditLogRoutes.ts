import { Router } from 'express';
import { getAdminAuditLogs } from '../controllers/auditLogController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const adminAuditLogRouter = Router();
adminAuditLogRouter.use(requireAuth, requirePermission('manage:employees'));
adminAuditLogRouter.get('/', getAdminAuditLogs);
