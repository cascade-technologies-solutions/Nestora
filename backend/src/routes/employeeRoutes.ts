import { Router } from 'express';
import {
  getAdminEmployees,
  createAdminEmployee,
  updateAdminEmployee,
  setEmployeeStatus,
  resetEmployeePassword,
  updateEmployeePermissions,
  deleteAdminEmployee,
} from '../controllers/employeeController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const adminEmployeeRouter = Router();
adminEmployeeRouter.use(requireAuth, requirePermission('manage:employees'));

adminEmployeeRouter.get('/', getAdminEmployees);
adminEmployeeRouter.post('/', createAdminEmployee);
adminEmployeeRouter.put('/:id', updateAdminEmployee);
adminEmployeeRouter.patch('/:id/status', setEmployeeStatus);
adminEmployeeRouter.post('/:id/reset-password', resetEmployeePassword);
adminEmployeeRouter.put('/:id/permissions', updateEmployeePermissions);
adminEmployeeRouter.delete('/:id', deleteAdminEmployee);
