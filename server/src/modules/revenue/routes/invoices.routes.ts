import { Router } from 'express';

import { invoiceController } from '../controllers/invoice.controller';

const router = Router();

router.get('/', invoiceController.list);
router.post('/', ...invoiceController.create);

router.post('/:id/restore', ...invoiceController.restore);
router.patch('/:id/status', ...invoiceController.changeStatus);

router.get('/:id/payments', ...invoiceController.listPayments);
router.post('/:id/payments', ...invoiceController.addPayment);
router.put('/:id/payments/:paymentId', ...invoiceController.updatePayment);
router.delete('/:id/payments/:paymentId', ...invoiceController.removePayment);

router.get('/:id/files', ...invoiceController.listFiles);
router.post('/:id/files', ...invoiceController.addFile);
router.delete('/:id/files/:fileId', ...invoiceController.removeFile);

router.get('/:id', ...invoiceController.getById);
router.put('/:id', ...invoiceController.update);
router.patch('/:id', ...invoiceController.patch);
router.delete('/:id', ...invoiceController.remove);

export const invoicesRouter = router;
