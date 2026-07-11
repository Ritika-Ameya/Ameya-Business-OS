import type { GoogleAuthServiceInterface } from '../interfaces';
import type { ComponentHealthCheck, InfrastructureHealthResponse } from '../types';
import { googleAuthService } from '../integrations/google';
import { toISOString } from '../utils/date.util';
import { BaseService } from './base.service';
import type { GoogleDriveService } from './googleDrive.service';
import type { GoogleSheetsService } from './googleSheets.service';

const measureCheck = async (
  check: () => Promise<boolean>,
  successMessage: string,
  failureMessage: string,
): Promise<ComponentHealthCheck> => {
  const start = Date.now();

  try {
    const healthy = await check();
    const latencyMs = Date.now() - start;

    return {
      status: healthy ? 'healthy' : 'unhealthy',
      message: healthy ? successMessage : failureMessage,
      latencyMs,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : failureMessage,
      latencyMs: Date.now() - start,
    };
  }
};

export class InfrastructureHealthService extends BaseService {
  constructor(
    private readonly authService: GoogleAuthServiceInterface = googleAuthService,
    private readonly sheetsService?: GoogleSheetsService,
    private readonly driveService?: GoogleDriveService,
  ) {
    super('InfrastructureHealthService');
  }

  async getInfrastructureHealth(): Promise<InfrastructureHealthResponse> {
    this.logDebug('Running infrastructure health checks');

    const [googleAuth, googleSheets, googleDrive] = await Promise.all([
      measureCheck(
        () => this.authService.validateConnection(),
        'Google authentication is healthy',
        'Google authentication failed',
      ),
      measureCheck(
        () => this.sheetsService?.validateConnection() ?? Promise.resolve(false),
        'Google Sheets connection is healthy',
        'Google Sheets connection failed',
      ),
      measureCheck(
        () => this.driveService?.validateConnection() ?? Promise.resolve(false),
        'Google Drive connection is healthy',
        'Google Drive connection failed',
      ),
    ]);

    const allHealthy =
      googleAuth.status === 'healthy' &&
      googleSheets.status === 'healthy' &&
      googleDrive.status === 'healthy';

    return {
      success: allHealthy,
      timestamp: toISOString(),
      checks: {
        googleAuth,
        googleSheets,
        googleDrive,
      },
    };
  }
}
