import { Router } from 'express';
import {
  uploadMedia,
  getMediaAssets,
  renameMediaAsset,
  replaceMediaAsset,
  deleteMediaAsset,
  bulkDeleteMediaAssets,
} from '../controllers/mediaController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';
import { upload } from '../services/storageService';

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAuth, requirePermission('manage:media'));

// Upload files (supports field 'files' or 'file')
adminMediaRouter.post('/upload', upload.array('files', 10), uploadMedia);

// List media assets
adminMediaRouter.get('/', getMediaAssets);

// Rename asset
adminMediaRouter.patch('/:id/rename', renameMediaAsset);

// Replace asset
adminMediaRouter.post('/:id/replace', upload.single('file'), replaceMediaAsset);

// Delete single asset
adminMediaRouter.delete('/:id', deleteMediaAsset);

// Bulk delete assets
adminMediaRouter.post('/bulk-delete', bulkDeleteMediaAssets);
