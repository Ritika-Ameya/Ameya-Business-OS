import { env } from '../../config';
import { getGoogleServiceAccountConfig } from '../google/googleAccount.config';
import { GoogleDriveClient } from './googleDrive.client';

export const createGoogleDriveClient = (): GoogleDriveClient => {
  return new GoogleDriveClient({
    ...getGoogleServiceAccountConfig(),
    folderId: env.GOOGLE_DRIVE_FOLDER_ID,
  });
};

export { GoogleDriveClient } from './googleDrive.client';
