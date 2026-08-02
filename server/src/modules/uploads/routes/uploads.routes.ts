import { Router } from 'express';

import { uploadController } from '../controllers/upload.controller';

const router = Router();

router.get('/drive/:fileId', ...uploadController.downloadDriveFile);
router.post('/', ...uploadController.create);

export default router;
