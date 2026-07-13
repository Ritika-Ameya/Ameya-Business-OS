import { Router } from 'express';

import { customersRouter } from '../modules/customers';
import { mastersRouter } from '../modules/masters';
import { healthRouter } from './health.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/settings/masters', mastersRouter);
router.use('/customers', customersRouter);

export default router;
