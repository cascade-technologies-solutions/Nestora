import { Router } from 'express';
import {
  submitPublicEnquiry,
  getAdminEnquiries,
  getAdminEnquiryById,
  updateAdminEnquiry,
  deleteAdminEnquiry,
} from '../controllers/enquiryController';
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

export const publicEnquiryRouter = Router();
publicEnquiryRouter.post('/', submitPublicEnquiry);

export const adminEnquiryRouter = Router();
adminEnquiryRouter.use(requireAuth, requirePermission('manage:enquiries'));
adminEnquiryRouter.get('/', getAdminEnquiries);
adminEnquiryRouter.get('/:id', getAdminEnquiryById);
adminEnquiryRouter.patch('/:id', updateAdminEnquiry);
adminEnquiryRouter.delete('/:id', deleteAdminEnquiry);
