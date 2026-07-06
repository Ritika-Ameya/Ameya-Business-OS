import { env } from '../../config';
import { GoogleDriveClient } from './googleDrive.client';

export const createGoogleDriveClient = (): GoogleDriveClient => {
  return new GoogleDriveClient({
    projectId: env.GOOGLE_PROJECT_ID,
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKey: env.GOOGLE_PRIVATE_KEY,
    folderId: env.GOOGLE_DRIVE_FOLDER_ID,
  });
};

export { GoogleDriveClient } from './googleDrive.client';
