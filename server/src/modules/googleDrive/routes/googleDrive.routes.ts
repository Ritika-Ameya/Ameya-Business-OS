import { Router } from 'express';

import { authenticate, requireRole } from '../../auth';
import { googleDriveController } from '../controllers/googleDrive.controller';

const router = Router();

router.get('/connect', authenticate, requireRole('super_admin'), googleDriveController.connect);
router.get('/status', authenticate, requireRole('super_admin'), googleDriveController.status);
router.post(
  '/disconnect',
  authenticate,
  requireRole('super_admin'),
  googleDriveController.disconnect,
);
router.get('/callback', googleDriveController.callback);

export default router;
