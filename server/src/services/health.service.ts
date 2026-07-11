import { APP_NAME, APP_VERSION } from '../constants';
import type { HealthCheckResponse } from '../types';
import { BaseService } from './base.service';

export class HealthService extends BaseService {
  constructor() {
    super('HealthService');
  }

  getHealthStatus(): HealthCheckResponse {
    this.logDebug('Health check requested');

    return {
      success: true,
      application: APP_NAME,
      version: APP_VERSION,
      status: 'Running',
    };
  }
}

export const healthService = new HealthService();
