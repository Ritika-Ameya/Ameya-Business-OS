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
    return this.client.readSheet(range);
  }

  async readByRange(range: string): Promise<string[][]> {
    return this.client.readByRange(range);
  }

  async appendRows(range: string, values: string[][]): Promise<SheetAppendResult> {
    this.logDebug(`Appending ${values.length} row(s) to ${range}`);
    return this.client.appendRows(range, values);
  }

  async updateRows(range: string, values: string[][]): Promise<SheetUpdateResult> {
    this.logDebug(`Updating rows at ${range}`);
    return this.client.updateRows(range, values);
  }

  async deleteRows(sheetId: number, startIndex: number, endIndex: number): Promise<void> {
    this.logDebug(`Deleting rows ${startIndex}-${endIndex} from sheet ${sheetId}`);
    return this.client.deleteRows(sheetId, startIndex, endIndex);
  }

  async batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<void> {
    this.logDebug(`Executing batch update with ${requests.length} request(s)`);
    return this.client.batchUpdate(requests);
  }

  getClient(): GoogleSheetsClientInterface {
    return this.client;
  }
}

export const createGoogleSheetsService = (client: GoogleSheetsClient): GoogleSheetsService =>
  new GoogleSheetsService(client);
