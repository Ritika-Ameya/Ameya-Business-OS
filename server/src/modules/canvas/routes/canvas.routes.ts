import { Router } from 'express';

import { canvasController } from '../controllers/canvas.controller';

const router = Router();

router.get('/', canvasController.getBoard);
router.put('/temperatures/:customerId', ...canvasController.setTemperature);
router.post('/receipts', ...canvasController.createReceipt);
router.patch('/receipts', ...canvasController.updateReceipt);
router.post('/receipts/schedule', ...canvasController.schedule);
router.post('/receipts/dismiss', ...canvasController.dismiss);
router.post('/receipts/split', ...canvasController.split);

export const canvasRouter = router;
