import { env } from '../../config';
import { getGoogleServiceAccountConfig } from '../google/googleAccount.config';
import { GoogleSheetsClient } from './googleSheets.client';

export const createGoogleSheetsClient = (): GoogleSheetsClient => {
  return new GoogleSheetsClient({
    ...getGoogleServiceAccountConfig(),
    sheetId: env.GOOGLE_SHEET_ID,
  });
};

export { GoogleSheetsClient } from './googleSheets.client';
