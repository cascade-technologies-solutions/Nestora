import { Router } from 'express';
import {
  getPublicProjects,
  getPublicProjectById,
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const publicProjectRouter = Router();
publicProjectRouter.get('/', getPublicProjects);
publicProjectRouter.get('/:id', getPublicProjectById);

export const adminProjectRouter = Router();
adminProjectRouter.use(requireAuth, requirePermission('manage:projects'));
adminProjectRouter.get('/', getAdminProjects);
adminProjectRouter.post('/', createProject);
adminProjectRouter.put('/:id', updateProject);
adminProjectRouter.delete('/:id', deleteProject);
