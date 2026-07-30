import { env } from '../../../config';
import { googleDriveOAuthService, googleDriveService } from '../../../integrations';
import { ValidationError } from '../../../utils/AppError';
import {
  createGoogleDriveState,
  verifyGoogleDriveState,
} from '../../../integrations/googleDrive/googleDriveState.util';

export interface GoogleDriveStatusResponse {
  connected: boolean;
  email: string;
  folderId: string;
  folderName: string;
  oauthConfigured: boolean;
}

export interface GoogleDriveConnectResponse {
  alreadyConnected: boolean;
  authorizationUrl: string | null;
  status: GoogleDriveStatusResponse;
}

export class GoogleDriveConnectionService {
  getConnectUrl(): string {
    if (!googleDriveOAuthService.isConfigured()) {
      throw new ValidationError(
        'Google Drive OAuth is not configured. Set GOOGLE_DRIVE_OAUTH_CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI.',
      );
    }
    const state = createGoogleDriveState();
    return googleDriveOAuthService.getAuthorizationUrl(state);
  }

  async startConnect(): Promise<GoogleDriveConnectResponse> {
    const status = await this.getStatus();
    if (status.connected) {
      return {
        alreadyConnected: true,
        authorizationUrl: null,
        status,
      };
    }

    return {
      alreadyConnected: false,
      authorizationUrl: this.getConnectUrl(),
      status,
    };
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

  getPostConnectRedirectUrl(): string | null {
    const frontend = env.FRONTEND_URL?.trim();
    if (!frontend) return null;
    return `${frontend.replace(/\/$/, '')}/settings/company?driveConnected=1`;
  }

  async getStatus(): Promise<GoogleDriveStatusResponse> {
    const oauthConfigured = googleDriveOAuthService.isConfigured();
    const status = await googleDriveOAuthService.getConnectionStatus();

    if (!status.connected) {
      return {
        connected: false,
        email: status.email,
        folderId: env.GOOGLE_DRIVE_FOLDER_ID,
        folderName: '',
        oauthConfigured,
      };
    }

    try {
      const folderMeta = await googleDriveService.getMetadata(env.GOOGLE_DRIVE_FOLDER_ID);
      return {
        connected: true,
        email: status.email,
        folderId: env.GOOGLE_DRIVE_FOLDER_ID,
        folderName: folderMeta.name,
        oauthConfigured,
      };
    } catch {
      return {
        connected: true,
        email: status.email,
        folderId: env.GOOGLE_DRIVE_FOLDER_ID,
        folderName: '',
        oauthConfigured,
      };
    }
  }
}

export const googleDriveConnectionService = new GoogleDriveConnectionService();
