import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants';
import type { HealthService } from '../services/health.service';
import { healthService } from '../services/health.service';
import type { InfrastructureHealthService } from '../services/infrastructureHealth.service';
import { infrastructureHealthService } from '../integrations';
import { asyncHandler } from '../utils/asyncHandler.util';

export class HealthController {
  constructor(
    private readonly service: HealthService = healthService,
    private readonly infraHealthService: InfrastructureHealthService = infrastructureHealthService,
  ) {}

  getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const health = this.service.getHealthStatus();
    res.status(HTTP_STATUS.OK).json(health);
  });

  getInfrastructureHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const health = await this.infraHealthService.getInfrastructureHealth();
    const statusCode = health.success ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(health);
  });
}

export const healthController = new HealthController();
