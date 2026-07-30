import { google } from 'googleapis';

import { GOOGLE_DRIVE_OAUTH_SCOPES } from '../../constants';
import type { GoogleDriveConfig } from '../../interfaces';
import { ValidationError } from '../../utils/AppError';
import { createLogger } from '../../utils/logger.util';
import { googleDriveTokenStore, type DriveRefreshTokenRecord } from './googleDriveTokenStore';

export interface GoogleDriveConnectionStatus {
  connected: boolean;
  email: string;
}

export class GoogleDriveOAuthService {
  private readonly logger = createLogger('GoogleDriveOAuthService');

  constructor(private readonly config: GoogleDriveConfig) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.oauthClientId &&
        this.config.oauthClientSecret &&
        this.config.oauthRedirectUri &&
        this.config.folderId,
    );
  }

  private createOAuthClient() {
    if (!this.isConfigured()) {
      throw new ValidationError(
        'Google Drive OAuth is not configured. Set Drive OAuth client credentials.',
      );
    }
    return new google.auth.OAuth2(
      this.config.oauthClientId,
      this.config.oauthClientSecret,
      this.config.oauthRedirectUri,
    );
  }

  getAuthorizationUrl(state: string): string {
    const client = this.createOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [...GOOGLE_DRIVE_OAUTH_SCOPES],
      state,
    });
  }

  private async fetchAuthorizedEmail(client: InstanceType<typeof google.auth.OAuth2>): Promise<string> {
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const profile = await oauth2.userinfo.get();
    return profile.data.email?.trim().toLowerCase() ?? '';
  }

  private assertAllowedEmail(email: string): void {
    const allowed = this.config.adminEmail.trim().toLowerCase();
    if (!allowed) return;
    if (email !== allowed) {
      throw new ValidationError(
        `Unauthorized Google account. Please authorize ${this.config.adminEmail}`,
      );
    }
  }

  async connectWithAuthorizationCode(code: string): Promise<DriveRefreshTokenRecord> {
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);
    const refreshToken = tokens.refresh_token?.trim();

    if (!refreshToken) {
      throw new ValidationError(
        'Google did not return a refresh token. Revoke previous access and reconnect.',
      );
    }

    client.setCredentials({ refresh_token: refreshToken });
    const email = await this.fetchAuthorizedEmail(client);
    if (!email) {
      throw new ValidationError('Unable to verify authorized Google account');
    }
    this.assertAllowedEmail(email);

    const record: DriveRefreshTokenRecord = {
      refreshToken,
      email,
      updatedAt: new Date().toISOString(),
    };
    await googleDriveTokenStore.save(record);
    this.logger.info(`Google Drive connected with ${email}`);
    return record;
  }

  async getAuthorizedClient(): Promise<InstanceType<typeof google.auth.OAuth2>> {
    const record = await googleDriveTokenStore.load();
    if (!record?.refreshToken) {
      throw new ValidationError('Google Drive is not connected');
    }

    this.assertAllowedEmail(record.email);

    const client = this.createOAuthClient();
    client.setCredentials({ refresh_token: record.refreshToken });
    return client;
  }

  async getConnectionStatus(): Promise<GoogleDriveConnectionStatus> {
    const record = await googleDriveTokenStore.load();
    if (!record) {
      return { connected: false, email: '' };
    }

    try {
      const client = this.createOAuthClient();
      client.setCredentials({ refresh_token: record.refreshToken });
      const email = await this.fetchAuthorizedEmail(client);
      this.assertAllowedEmail(email);
      return { connected: Boolean(email), email };
    } catch (error) {
      this.logger.warn('Google Drive OAuth status check failed', { error });
      return { connected: false, email: record.email };
    }
  }
}
