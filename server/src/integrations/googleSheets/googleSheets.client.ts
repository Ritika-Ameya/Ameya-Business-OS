import { google, type sheets_v4 } from 'googleapis';

import { GOOGLE_SCOPES } from '../../constants';
import type { GoogleAuthService } from '../google/googleAuth.service';
import { googleAuthService } from '../google/googleAuth.service';
import { wrapGoogleOperation } from '../google/googleError.mapper';
import { withGoogleRetry } from '../google/googleRetry.util';
import { getGoogleRequestOptions } from '../google/googleAccount.config';
import type { GoogleSheetsClientInterface, GoogleSheetsConfig } from '../../interfaces';
import type {
  SheetAppendResult,
  SheetReadResult,
  SheetTabInfo,
  SheetUpdateResult,
} from '../../types';

export class GoogleSheetsClient implements GoogleSheetsClientInterface {
  private readonly config: GoogleSheetsConfig;
  private readonly authService: GoogleAuthService;
  private readonly requestOptions: ReturnType<typeof getGoogleRequestOptions>;

  constructor(config: GoogleSheetsConfig, authService: GoogleAuthService = googleAuthService) {
    this.config = config;
    this.authService = authService;
    this.requestOptions = getGoogleRequestOptions();
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.projectId &&
        this.config.clientEmail &&
        this.config.privateKey &&
        this.config.sheetId,
    );
  }

  private getSheetsApi(): sheets_v4.Sheets {
    const auth = this.authService.getJwtClient([GOOGLE_SCOPES.SHEETS]);
    return google.sheets({ version: 'v4', auth: auth });
  }

  async validateConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.getSpreadsheetTitle();
      return true;
    } catch {
      return false;
    }
  }

  async getSpreadsheetTitle(): Promise<string> {
    return wrapGoogleOperation('Google Sheets getSpreadsheetTitle', async () =>
      withGoogleRetry(async () => {
        const sheets = this.getSheetsApi();
        const response = await sheets.spreadsheets.get(
          { spreadsheetId: this.config.sheetId, fields: 'properties.title' },
          { timeout: this.requestOptions.timeout },
        );
        return response.data.properties?.title ?? 'Untitled';
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async getSheetTabs(): Promise<SheetTabInfo[]> {
    return wrapGoogleOperation('Google Sheets getSheetTabs', async () =>
      withGoogleRetry(async () => {
        const sheets = this.getSheetsApi();
        const response = await sheets.spreadsheets.get(
          {
            spreadsheetId: this.config.sheetId,
            fields: 'sheets(properties(sheetId,title,index))',
          },
          { timeout: this.requestOptions.timeout },
        );

        return (
          response.data.sheets?.map((sheet) => ({
            sheetId: sheet.properties?.sheetId ?? 0,
            title: sheet.properties?.title ?? '',
            index: sheet.properties?.index ?? 0,
          })) ?? []
        );
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async getSheetIdByName(sheetName: string): Promise<number> {
    const tabs = await this.getSheetTabs();
    const tab = tabs.find((t) => t.title === sheetName);

    if (!tab) {
      throw new Error(`Sheet tab "${sheetName}" not found`);
    }

    return tab.sheetId;
  }

  async readSheet(range = 'A:ZZ'): Promise<SheetReadResult> {
    const values = await this.readByRange(range);
    return { range, values };
  }

  async readByRange(range: string): Promise<string[][]> {
    return wrapGoogleOperation(`Google Sheets readByRange(${range})`, async () =>
      withGoogleRetry(async () => {
        const sheets = this.getSheetsApi();
        const response = await sheets.spreadsheets.values.get(
          {
            spreadsheetId: this.config.sheetId,
            range,
            valueRenderOption: 'UNFORMATTED_VALUE',
            dateTimeRenderOption: 'FORMATTED_STRING',
          },
          { timeout: this.requestOptions.timeout },
        );

        return (response.data.values ?? []) as string[][];
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async appendRows(range: string, values: string[][]): Promise<SheetAppendResult> {
    return wrapGoogleOperation(`Google Sheets appendRows(${range})`, async () =>
      withGoogleRetry(async () => {
        const sheets = this.getSheetsApi();
        const response = await sheets.spreadsheets.values.append(
          {
            spreadsheetId: this.config.sheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values },
          },
          { timeout: this.requestOptions.timeout },
        );

        const updates = response.data.updates;
        return {
          updatedRange: updates?.updatedRange ?? range,
          updatedRows: updates?.updatedRows ?? values.length,
        };
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async updateRows(range: string, values: string[][]): Promise<SheetUpdateResult> {
    return wrapGoogleOperation(`Google Sheets updateRows(${range})`, async () =>
      withGoogleRetry(async () => {
        const sheets = this.getSheetsApi();
        const response = await sheets.spreadsheets.values.update(
          {
            spreadsheetId: this.config.sheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
          },
          { timeout: this.requestOptions.timeout },
        );

        return {
          updatedRange: response.data.updatedRange ?? range,
          updatedCells: response.data.updatedCells ?? 0,
        };
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async deleteRows(sheetId: number, startIndex: number, endIndex: number): Promise<void> {
    await this.batchUpdate([
      {
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex,
            endIndex,
          },
        },
      },
    ]);
  }

  async batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<void> {
    if (requests.length === 0) {
      return;
    }

    await wrapGoogleOperation('Google Sheets batchUpdate', async () =>
      withGoogleRetry(async () => {
        const sheets = this.getSheetsApi();
        await sheets.spreadsheets.batchUpdate(
          {
            spreadsheetId: this.config.sheetId,
            requestBody: { requests },
          },
          { timeout: this.requestOptions.timeout },
        );
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }
}
