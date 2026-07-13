import { Router } from 'express';

import { mastersRouter } from '../modules/masters';
import { healthRouter } from './health.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/settings/masters', mastersRouter);

export default router;
