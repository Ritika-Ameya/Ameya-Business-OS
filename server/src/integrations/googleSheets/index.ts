import { env } from '../../config';
import { GoogleSheetsClient } from './googleSheets.client';

export const createGoogleSheetsClient = (): GoogleSheetsClient => {
  return new GoogleSheetsClient({
    projectId: env.GOOGLE_PROJECT_ID,
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKey: env.GOOGLE_PRIVATE_KEY,
    sheetId: env.GOOGLE_SHEET_ID,
  });
};

export { GoogleSheetsClient } from './googleSheets.client';
