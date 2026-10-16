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
import { requireAuth, requirePermission, Permission } from '../middleware/authMiddleware';

export const adminAuthRouter = Router();
adminAuthRouter.post('/login', adminLogin);
adminAuthRouter.post('/refresh', adminRefresh);
adminAuthRouter.post('/logout', adminLogout);
adminAuthRouter.get('/me', requireAuth, adminMe);

// Permission verification test endpoint
adminAuthRouter.get('/verify-permission/:perm', requireAuth, (req, res, next) => {
  const perm = req.params.perm as Permission;
  requirePermission(perm)(req, res, next);
}, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: `Access granted for ${req.params.perm}`,
      permission: req.params.perm,
      user: req.user?.username,
      role: req.user?.role,
    },
  });
});

export const publicAuthRouter = Router();
publicAuthRouter.post('/register', publicRegister);
publicAuthRouter.post('/login', publicLogin);
publicAuthRouter.post('/refresh', publicRefresh);
publicAuthRouter.post('/logout', publicLogout);
publicAuthRouter.get('/me', requireAuth, publicMe);
