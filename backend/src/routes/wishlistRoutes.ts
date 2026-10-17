import { Router } from 'express';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController';
import { requireAuth } from '../middleware/authMiddleware';

export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);
wishlistRouter.get('/', getUserWishlist);
wishlistRouter.post('/:propertyId', addToWishlist);
wishlistRouter.delete('/:propertyId', removeFromWishlist);
