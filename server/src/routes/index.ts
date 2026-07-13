import { Router } from 'express';

import { customersRouter } from '../modules/customers';
import { dealsRouter } from '../modules/deals';
import { mastersRouter } from '../modules/masters';
import { invoicesRouter } from '../modules/revenue';
import { healthRouter } from './health.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/settings/masters', mastersRouter);
router.use('/customers', customersRouter);
router.use('/deals', dealsRouter);
router.use('/invoices', invoicesRouter);

export default router;
