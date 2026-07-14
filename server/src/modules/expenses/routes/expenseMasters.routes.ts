import { Router } from 'express';

import { expenseMasterController } from '../controllers/expenseMaster.controller';

const router = Router();

router.get('/', expenseMasterController.list);
router.post('/', ...expenseMasterController.create);

router.post('/:id/restore', ...expenseMasterController.restore);

router.get('/:id', ...expenseMasterController.getById);
router.put('/:id', ...expenseMasterController.update);
router.patch('/:id', ...expenseMasterController.patch);
router.delete('/:id', ...expenseMasterController.remove);

export const expenseMastersRouter = router;
