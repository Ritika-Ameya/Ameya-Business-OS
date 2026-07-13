import { Router } from 'express';

import { customersRouter } from '../modules/customers';
import { dealsRouter } from '../modules/deals';
import { mastersRouter } from '../modules/masters';
import { healthRouter } from './health.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/settings/masters', mastersRouter);
router.use('/customers', customersRouter);
router.use('/deals', dealsRouter);

export default router;
