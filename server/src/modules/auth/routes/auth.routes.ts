import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { requireRole } from '../middleware/authorize.middleware';

const router = Router();

// Public auth routes
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Authenticated routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.me);

// Profile
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

// User management — admin+
router.get('/users', authenticate, requireRole('admin'), userController.list);
router.get('/users/:id', authenticate, requireRole('admin'), userController.getById);
router.post('/users', authenticate, requireRole('admin'), userController.create);
router.put('/users/:id', authenticate, requireRole('admin'), userController.update);
router.delete('/users/:id', authenticate, requireRole('admin'), userController.remove);
router.post('/users/:id/activate', authenticate, requireRole('admin'), userController.activate);
router.post('/users/:id/deactivate', authenticate, requireRole('admin'), userController.deactivate);
router.post('/users/:id/reset-password', authenticate, requireRole('admin'), userController.resetPassword);

export { router as authRouter };
