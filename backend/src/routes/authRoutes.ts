import { Router } from 'express';
import {
  adminLogin,
  adminRefresh,
  adminLogout,
  adminMe,
  publicRegister,
  publicLogin,
  publicRefresh,
  publicLogout,
  publicMe,
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

export const adminAuthRouter = Router();
adminAuthRouter.post('/login', adminLogin);
adminAuthRouter.post('/refresh', adminRefresh);
adminAuthRouter.post('/logout', adminLogout);
adminAuthRouter.get('/me', requireAuth, adminMe);

export const publicAuthRouter = Router();
publicAuthRouter.post('/register', publicRegister);
publicAuthRouter.post('/login', publicLogin);
publicAuthRouter.post('/refresh', publicRefresh);
publicAuthRouter.post('/logout', publicLogout);
publicAuthRouter.get('/me', requireAuth, publicMe);
