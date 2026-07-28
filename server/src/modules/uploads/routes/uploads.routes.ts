import { Router } from 'express';

import { uploadController } from '../controllers/upload.controller';

const router = Router();

router.post('/', ...uploadController.create);

export default router;
