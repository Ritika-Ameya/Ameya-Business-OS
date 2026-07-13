import type { PersistenceContract, SheetTabInfo } from '../../types';
import { BaseService } from '../base.service';
import type { GoogleSheetsService } from '../googleSheets.service';
import {
  BOOTSTRAP_MASTER_CONTRACTS,
  BOOTSTRAP_REQUIRED_TAB_NAMES,
  DEFAULT_SHEET1_TITLE,
} from './bootstrap.registry';
import { HeaderManager, type HeaderEnsureResult } from './headerManager.service';

export type BootstrapRunStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface WorksheetBootstrapDetail {
  tabName: string;
  existed: boolean;
  created: boolean;
  headers: HeaderEnsureResult;
}

export interface BootstrapResult {
  status: BootstrapRunStatus;
  spreadsheetTitle: string | null;
  completedAt: string | null;
  createdWorksheets: string[];
  existingWorksheets: string[];
  headerResults: HeaderEnsureResult[];
  deletedDefaultSheet1: boolean;
  details: WorksheetBootstrapDetail[];
  error: string | null;
}

const emptyResult = (): BootstrapResult => ({
  status: 'idle',
  spreadsheetTitle: null,
  completedAt: null,
  createdWorksheets: [],
  existingWorksheets: [],
  headerResults: [],
  deletedDefaultSheet1: false,
  details: [],
  error: null,
});

/**
 * One-shot platform bootstrap for Google Sheets worksheets + headers.
 * Repositories must never create worksheets — they consume this service's outcome.
 */
export class BootstrapService extends BaseService {
  private ran = false;
  private result: BootstrapResult = emptyResult();
  private readonly headerManager: HeaderManager;

  constructor(
    private readonly sheetsService: GoogleSheetsService,
    private readonly contracts: readonly PersistenceContract[] = BOOTSTRAP_MASTER_CONTRACTS,
  ) {
    super('BootstrapService');
    this.headerManager = new HeaderManager(sheetsService);
  }

  getStatus(): BootstrapResult {
    return { ...this.result };
  }

  hasCompletedSuccessfully(): boolean {
    return this.result.status === 'completed';
  }

  getHeaderManager(): HeaderManager {
    return this.headerManager;
  }

  /**
   * Executes bootstrap exactly once per process lifetime.
   */
  async run(): Promise<BootstrapResult> {
    if (this.ran) {
      this.logInfo('Bootstrap already executed — skipping');
      return this.getStatus();
    }

    this.ran = true;
    this.result = { ...emptyResult(), status: 'running' };

    try {
      if (!this.sheetsService.isConfigured()) {
        throw new Error('Google Sheets is not configured');
      }

      const spreadsheetTitle = await this.sheetsService.getSpreadsheetTitle();
      this.logInfo(`Bootstrapping spreadsheet "${spreadsheetTitle}"`);

      const tabsBefore = await this.sheetsService.getSheetTabs();
      const existingTitles = new Set(tabsBefore.map((tab) => tab.title));
      const createdWorksheets: string[] = [];
      const existingWorksheets: string[] = [];
      const details: WorksheetBootstrapDetail[] = [];
      const headerResults: HeaderEnsureResult[] = [];

      for (const contract of this.contracts) {
        const existed = existingTitles.has(contract.tabName);

        if (!existed) {
          await this.sheetsService.createSheetTab(contract.tabName);
          existingTitles.add(contract.tabName);
          createdWorksheets.push(contract.tabName);
          this.logInfo(`Created worksheet "${contract.tabName}"`);
        } else {
          existingWorksheets.push(contract.tabName);
        }

        const headers = await this.headerManager.ensureHeaders(
          contract.tabName,
          contract.columns,
        );
        headerResults.push(headers);

        details.push({
          tabName: contract.tabName,
          existed,
          created: !existed,
          headers,
        });
      }

      const tabsAfter = await this.sheetsService.getSheetTabs();
      const deletedDefaultSheet1 = await this.maybeDeleteDefaultSheet1(tabsAfter);

      this.result = {
        status: 'completed',
        spreadsheetTitle,
        completedAt: new Date().toISOString(),
        createdWorksheets,
        existingWorksheets,
        headerResults,
        deletedDefaultSheet1,
        details,
        error: null,
      };

      this.logInfo(
        `Bootstrap completed — created ${createdWorksheets.length} worksheet(s), ` +
          `ensured headers on ${headerResults.length} worksheet(s)` +
          (deletedDefaultSheet1 ? ', removed empty Sheet1' : ''),
      );

      return this.getStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bootstrap failed';
      this.result = {
        ...this.result,
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: message,
      };
      this.logError('Bootstrap failed', error);
      return this.getStatus();
    }
  }

  /**
   * Deletes Sheet1 only when:
   * - all required worksheets exist
   * - Sheet1 still exists
   * - Sheet1 has no user data (empty / blank header only)
   * Never deletes any other worksheet.
   */
  private async maybeDeleteDefaultSheet1(tabs: SheetTabInfo[]): Promise<boolean> {
    const requiredPresent = BOOTSTRAP_REQUIRED_TAB_NAMES.every((name) =>
      tabs.some((tab) => tab.title === name),
    );

    if (!requiredPresent) {
      return false;
    }

    const sheet1 = tabs.find((tab) => tab.title === DEFAULT_SHEET1_TITLE);
    if (!sheet1) {
      return false;
    }

    if (tabs.length <= 1) {
      // Google requires at least one sheet — never delete the only tab
      return false;
    }

    const isEmpty = await this.isSheetEffectivelyEmpty(DEFAULT_SHEET1_TITLE);
    if (!isEmpty) {
      this.logWarn('Sheet1 contains data — leaving it untouched');
      return false;
    }

    await this.sheetsService.deleteSheetTab(sheet1.sheetId);
    this.logInfo('Deleted empty default Sheet1 after successful worksheet provisioning');
    return true;
  }

  private async isSheetEffectivelyEmpty(tabName: string): Promise<boolean> {
    const rows = await this.sheetsService.readByRange(`'${tabName}'!A1:ZZ20`);
    if (rows.length === 0) {
      return true;
    }

    return rows.every((row) => row.every((cell) => String(cell ?? '').trim() === ''));
  }
}
