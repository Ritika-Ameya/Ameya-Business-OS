import type { GoogleServiceAccountConfig } from './googleCommon.interface';

export type { GoogleSheetsClientInterface } from './googleClients.interface';

export interface GoogleSheetsConfig extends GoogleServiceAccountConfig {
  sheetId: string;
}
