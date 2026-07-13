import { Router } from 'express';

import { customerController } from '../controllers/customer.controller';

const router = Router();

router.get('/', customerController.list);
router.post('/', ...customerController.create);

router.post('/:id/restore', ...customerController.restore);
router.patch('/:id/stage', ...customerController.changeStage);
router.patch('/:id/record-type', ...customerController.changeRecordType);

router.get('/:id/timeline', ...customerController.getTimeline);
router.post('/:id/timeline', ...customerController.addTimelineNote);

router.get('/:id/files', ...customerController.listFiles);
router.post('/:id/files', ...customerController.addFile);
router.delete('/:id/files/:fileId', ...customerController.removeFile);

router.get('/:id', ...customerController.getById);
router.put('/:id', ...customerController.update);
router.patch('/:id', ...customerController.patch);
router.delete('/:id', ...customerController.remove);

export const customersRouter = router;
