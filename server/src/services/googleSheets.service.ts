import type { GoogleSheetsClientInterface } from '../interfaces';
import type {
  SheetAppendResult,
  SheetReadResult,
  SheetTabInfo,
  SheetUpdateResult,
} from '../types';
import type { sheets_v4 } from 'googleapis';
import { BaseService } from './base.service';
import type { GoogleSheetsClient } from '../integrations/googleSheets/googleSheets.client';
import {
  extractSheetTabName,
  getCachedSheetRead,
  invalidateSheetReadsForRange,
  invalidateSheetReadsForTab,
} from './sheets/sheetReadCache';

export class GoogleSheetsService extends BaseService {
  constructor(private readonly client: GoogleSheetsClientInterface) {
    super('GoogleSheetsService');
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  async validateConnection(): Promise<boolean> {
    this.logDebug('Validating Google Sheets connection');
    return this.client.validateConnection();
  }

  async getSpreadsheetTitle(): Promise<string> {
    return this.client.getSpreadsheetTitle();
  }

  async getSheetTabs(): Promise<SheetTabInfo[]> {
    return this.client.getSheetTabs();
  }

  async getSheetIdByName(sheetName: string): Promise<number> {
    return this.client.getSheetIdByName(sheetName);
  }

  async readSheet(range?: string): Promise<SheetReadResult> {
    const resolvedRange = range ?? 'A:ZZ';
    const values = await this.readByRange(resolvedRange);
    return { range: resolvedRange, values };
  }

  async readByRange(range: string): Promise<string[][]> {
    return getCachedSheetRead(range, () => this.client.readByRange(range));
  }

  async appendRows(range: string, values: string[][]): Promise<SheetAppendResult> {
    this.logDebug(`Appending ${values.length} row(s) to ${range}`);
    const result = await this.client.appendRows(range, values);
    this.invalidateAfterWrite(range);
    return result;
  }

  async updateRows(range: string, values: string[][]): Promise<SheetUpdateResult> {
    this.logDebug(`Updating rows at ${range}`);
    const result = await this.client.updateRows(range, values);
    this.invalidateAfterWrite(range);
    return result;
  }

  async deleteRows(sheetId: number, startIndex: number, endIndex: number): Promise<void> {
    this.logDebug(`Deleting rows ${startIndex}-${endIndex} from sheet ${sheetId}`);
    await this.client.deleteRows(sheetId, startIndex, endIndex);
    // Tab name unknown from sheetId alone — callers that soft-delete via updateRows
    // already invalidate. Hard deletes are rare; clear nothing by id.
  }

  async createSheetTab(title: string): Promise<number> {
    this.logInfo(`Creating worksheet "${title}"`);
    return this.client.createSheetTab(title);
  }

  async deleteSheetTab(sheetId: number): Promise<void> {
    this.logInfo(`Deleting worksheet sheetId=${sheetId}`);
    return this.client.deleteSheetTab(sheetId);
  }

  async batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<void> {
    this.logDebug(`Executing batch update with ${requests.length} request(s)`);
    return this.client.batchUpdate(requests);
  }

  getClient(): GoogleSheetsClientInterface {
    return this.client;
  }

  private invalidateAfterWrite(range: string): void {
    const tabName = extractSheetTabName(range);
    if (tabName) {
      invalidateSheetReadsForTab(tabName);
      return;
    }
    invalidateSheetReadsForRange(range);
  }
}

export const createGoogleSheetsService = (client: GoogleSheetsClient): GoogleSheetsService =>
  new GoogleSheetsService(client);
