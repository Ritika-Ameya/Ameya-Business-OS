import { google } from 'googleapis';

import { GOOGLE_SCOPES } from '../../constants';
import type { GoogleAuthConfig, GoogleAuthServiceInterface } from '../../interfaces';
import { createLogger } from '../../utils/logger.util';
import {
  getGoogleRequestOptions,
  getGoogleServiceAccountConfig,
  normalizePrivateKey,
} from './googleAccount.config';
import { wrapGoogleOperation } from './googleError.mapper';

type GoogleJwtClient = InstanceType<typeof google.auth.JWT>;

export class GoogleAuthService implements GoogleAuthServiceInterface {
  private static instance: GoogleAuthService | null = null;

  private readonly config: GoogleAuthConfig;
  private readonly logger = createLogger('GoogleAuthService');
  private jwtClients = new Map<string, GoogleJwtClient>();

  private constructor(config?: GoogleAuthConfig) {
    const accountConfig = getGoogleServiceAccountConfig();
    const requestOptions = getGoogleRequestOptions();

    this.config = {
      ...accountConfig,
      requestTimeoutMs: requestOptions.timeout,
      ...config,
      privateKey: normalizePrivateKey(config?.privateKey ?? accountConfig.privateKey),
    };
  }

  static getInstance(config?: GoogleAuthConfig): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService(config);
    }
    return GoogleAuthService.instance;
  }

  /** Reset singleton — intended for testing only */
  static resetInstance(): void {
    GoogleAuthService.instance = null;
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.projectId && this.config.clientEmail && this.config.privateKey,
    );
  }

  getJwtClient(scopes: string[]): GoogleJwtClient {
    const scopeKey = scopes.sort().join('|');
    const existing = this.jwtClients.get(scopeKey);

    if (existing) {
      return existing;
    }

    const client = new google.auth.JWT({
      email: this.config.clientEmail,
      key: this.config.privateKey,
      scopes,
    });

    this.jwtClients.set(scopeKey, client);
    return client;
  }

  async getAccessToken(): Promise<string | null> {
    const client = this.getJwtClient([GOOGLE_SCOPES.SHEETS, GOOGLE_SCOPES.DRIVE]);
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token ?? null;
  }

  async validateConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    return wrapGoogleOperation('Google authentication validation', async () => {
      const token = await this.getAccessToken();
      return token !== null;
    }).catch((error) => {
      this.logger.error('Google authentication validation failed', error);
      return false;
    });
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
