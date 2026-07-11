import { env } from '../config';
import { createGoogleDriveClient } from './googleDrive';
import { createGoogleSheetsClient } from './googleSheets';
import { googleAuthService } from './google';
import { createGoogleDriveService } from '../services/googleDrive.service';
import { createGoogleSheetsService } from '../services/googleSheets.service';
import { InfrastructureHealthService } from '../services/infrastructureHealth.service';

export const googleSheetsClient = createGoogleSheetsClient();
export const googleDriveClient = createGoogleDriveClient();

export const googleSheetsService = createGoogleSheetsService(googleSheetsClient);
export const googleDriveService = createGoogleDriveService(googleDriveClient);

export const infrastructureHealthService = new InfrastructureHealthService(
  googleAuthService,
  googleSheetsService,
  googleDriveService,
);

export { googleAuthService, GoogleAuthService } from './google';
export { GoogleSheetsClient, createGoogleSheetsClient } from './googleSheets';
export { GoogleDriveClient, createGoogleDriveClient } from './googleDrive';

export const getGoogleInfrastructureConfig = () => ({
  sheetId: env.GOOGLE_SHEET_ID,
  driveFolderId: env.GOOGLE_DRIVE_FOLDER_ID,
  requestTimeoutMs: env.GOOGLE_REQUEST_TIMEOUT_MS,
  maxRetries: env.GOOGLE_MAX_RETRIES,
});
