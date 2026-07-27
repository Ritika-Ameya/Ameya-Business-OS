import { Router } from 'express';

import { dashboardRouter, reportsRouter } from '../modules/analytics';
import { authRouter, authenticate } from '../modules/auth';
import { customersRouter } from '../modules/customers';
import { dealsRouter } from '../modules/deals';
import { expensesRouter, expenseMastersRouter } from '../modules/expenses';
import { mastersRouter } from '../modules/masters';
import { invoicesRouter } from '../modules/revenue';
import { healthRouter } from './health.routes';

const router = Router();

// Public
router.use('/health', healthRouter);
router.use('/auth', authRouter);

// Protected — require valid JWT
router.use('/settings/masters', authenticate, mastersRouter);
router.use('/customers', authenticate, customersRouter);
router.use('/deals', authenticate, dealsRouter);
router.use('/invoices', authenticate, invoicesRouter);
router.use('/expenses', authenticate, expensesRouter);
router.use('/expense-masters', authenticate, expenseMastersRouter);
router.use('/dashboard', authenticate, dashboardRouter);
router.use('/reports', authenticate, reportsRouter);

export default router;
