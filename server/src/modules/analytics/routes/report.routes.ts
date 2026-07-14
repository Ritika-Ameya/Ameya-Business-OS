import { Router } from 'express';

import { reportController } from '../controllers/report.controller';

const router = Router();

router.get('/revenue', reportController.getRevenue);
router.get('/expenses', reportController.getExpenses);
router.get('/outstanding', reportController.getOutstanding);
router.get('/renewals', reportController.getRenewals);

export const reportsRouter = router;
