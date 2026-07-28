import { env } from '../../config';
import { GoogleDriveClient } from './googleDrive.client';
import { GoogleDriveOAuthService } from './googleDriveOAuth.service';

const buildGoogleDriveConfig = () => ({
  folderId: env.GOOGLE_DRIVE_FOLDER_ID,
  oauthClientId: env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
  oauthClientSecret: env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
  oauthRedirectUri: env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI ?? '',
  adminEmail: env.GOOGLE_DRIVE_ADMIN_EMAIL,
});

export const googleDriveOAuthService = new GoogleDriveOAuthService(buildGoogleDriveConfig());

export const createGoogleDriveClient = (): GoogleDriveClient => {
  return new GoogleDriveClient(buildGoogleDriveConfig(), googleDriveOAuthService);
};

export { GoogleDriveClient } from './googleDrive.client';
export { GoogleDriveOAuthService } from './googleDriveOAuth.service';
