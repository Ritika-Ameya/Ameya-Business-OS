import { Router } from 'express';

import { healthController } from '../controllers/health.controller';

const healthRouter = Router();

healthRouter.get('/', healthController.getHealth);
healthRouter.get('/infrastructure', healthController.getInfrastructureHealth);

export { healthRouter };
