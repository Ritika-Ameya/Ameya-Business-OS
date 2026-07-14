import { Router } from 'express';

import { customersRouter } from '../modules/customers';
import { dealsRouter } from '../modules/deals';
import { expensesRouter, expenseMastersRouter } from '../modules/expenses';
import { mastersRouter } from '../modules/masters';
import { invoicesRouter } from '../modules/revenue';
import { healthRouter } from './health.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/settings/masters', mastersRouter);
router.use('/customers', customersRouter);
router.use('/deals', dealsRouter);
router.use('/invoices', invoicesRouter);
router.use('/expenses', expensesRouter);
router.use('/expense-masters', expenseMastersRouter);

export default router;
