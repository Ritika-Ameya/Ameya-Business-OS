import { env } from '../../../config';
import { googleDriveOAuthService, googleDriveService } from '../../../integrations';
import { ValidationError } from '../../../utils/AppError';
import { createGoogleDriveState, verifyGoogleDriveState } from '../../../integrations/googleDrive/googleDriveState.util';

export interface GoogleDriveStatusResponse {
  connected: boolean;
  email: string;
  folderId: string;
  folderName: string;
}

export class GoogleDriveConnectionService {
  getConnectUrl(): string {
    const state = createGoogleDriveState();
    return googleDriveOAuthService.getAuthorizationUrl(state);
  }

  async completeOAuthCallback(code: string, state: string): Promise<void> {
    if (!code?.trim()) {
      throw new ValidationError('Google authorization code is missing');
    }
    if (!state?.trim()) {
      throw new ValidationError('Google OAuth state is missing');
    }

    verifyGoogleDriveState(state);
    await googleDriveOAuthService.connectWithAuthorizationCode(code.trim());
  }

  async getStatus(): Promise<GoogleDriveStatusResponse> {
    const status = await googleDriveOAuthService.getConnectionStatus();

    if (!status.connected) {
      return {
        connected: false,
        email: status.email,
        folderId: env.GOOGLE_DRIVE_FOLDER_ID,
        folderName: '',
      };
    }

    const folderMeta = await googleDriveService.getMetadata(env.GOOGLE_DRIVE_FOLDER_ID);
    return {
      connected: true,
      email: status.email,
      folderId: env.GOOGLE_DRIVE_FOLDER_ID,
      folderName: folderMeta.name,
    };
  }
}

export const googleDriveConnectionService = new GoogleDriveConnectionService();
