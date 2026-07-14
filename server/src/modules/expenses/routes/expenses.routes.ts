import { Router } from 'express';

import { expenseController } from '../controllers/expense.controller';

const router = Router();

router.get('/', expenseController.list);
router.post('/', ...expenseController.create);

router.post('/:id/restore', ...expenseController.restore);
router.patch('/:id/status', ...expenseController.changeStatus);

router.get('/:id/files', ...expenseController.listFiles);
router.post('/:id/files', ...expenseController.addFile);
router.delete('/:id/files/:fileId', ...expenseController.removeFile);

router.get('/:id', ...expenseController.getById);
router.put('/:id', ...expenseController.update);
router.patch('/:id', ...expenseController.patch);
router.delete('/:id', ...expenseController.remove);

export const expensesRouter = router;
