import type { google } from 'googleapis';

type GoogleJwtClient = InstanceType<typeof google.auth.JWT>;

export interface GoogleAuthConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  requestTimeoutMs?: number;
}

export interface GoogleAuthServiceInterface {
  isConfigured(): boolean;
  getJwtClient(scopes: string[]): GoogleJwtClient;
  validateConnection(): Promise<boolean>;
  getAccessToken(): Promise<string | null>;
}
