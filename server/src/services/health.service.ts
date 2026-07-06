import { APP_NAME, APP_VERSION } from '../constants';
import type { HealthCheckResponse } from '../types';

export class HealthService {
  getHealthStatus(): HealthCheckResponse {
    return {
      success: true,
      application: APP_NAME,
      version: APP_VERSION,
      status: 'Running',
    };
  }
}

export const healthService = new HealthService();
