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

  async hasStoredRefreshToken(): Promise<boolean> {
    const record = await googleDriveTokenStore.load();
    return Boolean(record?.refreshToken);
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

  private async fetchAuthorizedEmail(
    client: InstanceType<typeof google.auth.OAuth2>,
  ): Promise<string> {
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

  private isInvalidGrantError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return message.toLowerCase().includes('invalid_grant');
  }

  private async persistRotatedRefreshToken(
    existing: DriveRefreshTokenRecord,
    refreshToken: string,
  ): Promise<void> {
    if (!refreshToken || refreshToken === existing.refreshToken) return;
    await googleDriveTokenStore.save({
      ...existing,
      refreshToken,
      updatedAt: new Date().toISOString(),
    });
    this.logger.info('Persisted rotated Google Drive refresh token');
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
    if (!this.isConfigured()) {
      throw new ValidationError(
        'Google Drive OAuth is not configured. Set Drive OAuth client credentials.',
      );
    }

    const record = await googleDriveTokenStore.load();
    if (!record?.refreshToken) {
      throw new ValidationError(
        'Google Drive is not connected. A Super Admin must connect Google Drive in Settings → Company.',
      );
    }

    this.assertAllowedEmail(record.email);

    const client = this.createOAuthClient();
    client.setCredentials({ refresh_token: record.refreshToken });

    // Persist rotated refresh tokens so Google rotation never silently disconnects us.
    client.on('tokens', (tokens) => {
      if (!tokens.refresh_token) return;
      void this.persistRotatedRefreshToken(record, tokens.refresh_token).catch((error) => {
        this.logger.warn('Failed to persist rotated Google Drive refresh token', { error });
      });
    });

    return client;
  }

  async getConnectionStatus(): Promise<GoogleDriveConnectionStatus> {
    const record = await googleDriveTokenStore.load();
    if (!record?.refreshToken) {
      return { connected: false, email: '' };
    }

    try {
      const client = this.createOAuthClient();
      client.setCredentials({ refresh_token: record.refreshToken });
      const email = await this.fetchAuthorizedEmail(client);
      this.assertAllowedEmail(email || record.email);
      return { connected: true, email: email || record.email };
    } catch (error) {
      if (this.isInvalidGrantError(error)) {
        this.logger.warn('Google Drive refresh token is invalid; connection requires reconnect', {
          error,
        });
        return { connected: false, email: record.email };
      }

      // Transient API/network failures must not look like a manual disconnect.
      this.logger.warn('Google Drive status probe failed; keeping stored connection', { error });
      return { connected: true, email: record.email };
    }
  }

  async disconnect(): Promise<void> {
    const record = await googleDriveTokenStore.load();
    if (record?.refreshToken) {
      try {
        const client = this.createOAuthClient();
        await client.revokeToken(record.refreshToken);
      } catch (error) {
        // Still clear local/durable storage even if Google revoke fails.
        this.logger.warn('Failed to revoke Google Drive token at Google', { error });
      }
    }

    await googleDriveTokenStore.clear();
    this.logger.info('Google Drive disconnected');
  }
}
