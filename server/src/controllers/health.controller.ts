import type { Request, Response } from 'express';

import type { HealthService } from '../services/health.service';
import { healthService } from '../services/health.service';
import { asyncHandler } from '../utils/asyncHandler.util';

export class HealthController {
  constructor(private readonly service: HealthService = healthService) {}

  getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const health = this.service.getHealthStatus();
    res.status(200).json(health);
  });
}

export const healthController = new HealthController();
