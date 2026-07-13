import { Router } from 'express';

import { dealController } from '../controllers/deal.controller';

const router = Router();

router.get('/', dealController.list);
router.post('/', ...dealController.create);

router.post('/:id/restore', ...dealController.restore);
router.patch('/:id/stage', ...dealController.changeStage);
router.patch('/:id/status', ...dealController.changeStatus);

router.get('/:id/timeline', ...dealController.getTimeline);
router.post('/:id/timeline', ...dealController.addTimelineNote);

router.get('/:id/components', ...dealController.listComponents);
router.post('/:id/components', ...dealController.addComponent);
router.put('/:id/components/:componentId', ...dealController.updateComponent);
router.delete('/:id/components/:componentId', ...dealController.removeComponent);

router.get('/:id/files', ...dealController.listFiles);
router.post('/:id/files', ...dealController.addFile);
router.delete('/:id/files/:fileId', ...dealController.removeFile);

router.get('/:id', ...dealController.getById);
router.put('/:id', ...dealController.update);
router.patch('/:id', ...dealController.patch);
router.delete('/:id', ...dealController.remove);

export const dealsRouter = router;
