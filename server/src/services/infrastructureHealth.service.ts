import type { GoogleAuthServiceInterface } from '../interfaces';
import type { ComponentHealthCheck, InfrastructureHealthResponse } from '../types';
import { googleAuthService } from '../integrations/google';
import { toISOString } from '../utils/date.util';
import { BaseService } from './base.service';
import type { GoogleDriveService } from './googleDrive.service';
import type { GoogleSheetsService } from './googleSheets.service';
import type { BootstrapService } from './sheets/bootstrap.service';
import { BOOTSTRAP_MASTER_CONTRACTS } from './sheets/bootstrap.registry';

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
    private readonly bootstrapService?: BootstrapService,
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
        'Google Drive folder is healthy',
        'Google Drive folder check failed',
      ),
    ]);

    const spreadsheet = await this.checkSpreadsheet();
    const worksheets = await this.checkWorksheets();
    const headers = await this.checkHeaders(worksheets);
    const bootstrap = this.checkBootstrap();

    const criticalHealthy =
      googleAuth.status === 'healthy' &&
      googleSheets.status === 'healthy' &&
      googleDrive.status === 'healthy' &&
      spreadsheet.status === 'healthy' &&
      worksheets.status === 'healthy' &&
      headers.status === 'healthy' &&
      bootstrap.status === 'healthy';

    return {
      success: criticalHealthy,
      timestamp: toISOString(),
      checks: {
        googleAuth,
        googleSheets,
        googleDrive,
        spreadsheet,
        worksheets,
        headers,
        bootstrap,
      },
    };
  }

  private checkBootstrap(): ComponentHealthCheck {
    const start = Date.now();
    const status = this.bootstrapService?.getStatus();

    if (!status) {
      return {
        status: 'unhealthy',
        message: 'BootstrapService is not configured',
        latencyMs: Date.now() - start,
      };
    }

    if (status.status === 'completed') {
      return {
        status: 'healthy',
        message: 'Bootstrap completed successfully',
        latencyMs: Date.now() - start,
        details: {
          spreadsheetTitle: status.spreadsheetTitle,
          createdWorksheets: status.createdWorksheets,
          existingWorksheets: status.existingWorksheets,
          deletedDefaultSheet1: status.deletedDefaultSheet1,
          completedAt: status.completedAt,
        },
      };
    }

    if (status.status === 'running') {
      return {
        status: 'degraded',
        message: 'Bootstrap is still running',
        latencyMs: Date.now() - start,
      };
    }

    return {
      status: 'unhealthy',
      message: status.error ?? `Bootstrap status: ${status.status}`,
      latencyMs: Date.now() - start,
      details: {
        status: status.status,
        error: status.error,
      },
    };
  }

  private async checkSpreadsheet(): Promise<ComponentHealthCheck> {
    const start = Date.now();

    try {
      if (!this.sheetsService) {
        return {
          status: 'unhealthy',
          message: 'Google Sheets service unavailable',
          latencyMs: Date.now() - start,
        };
      }

      const title = await this.sheetsService.getSpreadsheetTitle();
      return {
        status: 'healthy',
        message: `Spreadsheet accessible: ${title}`,
        latencyMs: Date.now() - start,
        details: { title },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Spreadsheet check failed',
        latencyMs: Date.now() - start,
      };
    }
  }

  private async checkWorksheets(): Promise<ComponentHealthCheck> {
    const start = Date.now();

    try {
      if (!this.sheetsService) {
        return {
          status: 'unhealthy',
          message: 'Google Sheets service unavailable',
          latencyMs: Date.now() - start,
        };
      }

      const tabs = await this.sheetsService.getSheetTabs();
      const titles = new Set(tabs.map((tab) => tab.title));
      const required = BOOTSTRAP_MASTER_CONTRACTS.map((contract) => contract.tabName);
      const missing = required.filter((name) => !titles.has(name));

      if (missing.length > 0) {
        return {
          status: 'unhealthy',
          message: `Missing worksheet(s): ${missing.join(', ')}`,
          latencyMs: Date.now() - start,
          details: { missing, present: required.filter((name) => titles.has(name)) },
        };
      }

      return {
        status: 'healthy',
        message: `All ${required.length} required worksheets present`,
        latencyMs: Date.now() - start,
        details: { worksheets: required },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Worksheet check failed',
        latencyMs: Date.now() - start,
      };
    }
  }

  private async checkHeaders(
    worksheetsCheck: ComponentHealthCheck,
  ): Promise<ComponentHealthCheck> {
    const start = Date.now();

    if (worksheetsCheck.status !== 'healthy' || !this.sheetsService) {
      return {
        status: 'unhealthy',
        message: 'Skipped header validation because worksheets are unhealthy',
        latencyMs: Date.now() - start,
      };
    }

    try {
      const headerManager = this.bootstrapService?.getHeaderManager();
      const issues: string[] = [];

      for (const contract of BOOTSTRAP_MASTER_CONTRACTS) {
        const headers = headerManager
          ? await headerManager.readHeaderRow(contract.tabName)
          : ((await this.sheetsService.readByRange(`'${contract.tabName}'!1:1`))[0] ?? []).map(
              (cell) => String(cell ?? '').trim(),
            );

        const present = new Set(headers.filter(Boolean));
        const missing = contract.columns.filter((column) => !present.has(column));
        if (missing.length > 0) {
          issues.push(`${contract.tabName}: missing ${missing.join(', ')}`);
        }
      }

      if (issues.length > 0) {
        return {
          status: 'unhealthy',
          message: 'One or more worksheets have incomplete headers',
          latencyMs: Date.now() - start,
          details: { issues },
        };
      }

      return {
        status: 'healthy',
        message: 'All required worksheet headers are present',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Header check failed',
        latencyMs: Date.now() - start,
      };
    }
  }
}
