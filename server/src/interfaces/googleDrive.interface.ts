export type { GoogleDriveClientInterface } from './googleClients.interface';

export interface GoogleDriveConfig {
  folderId: string;
  oauthClientId: string;
  oauthClientSecret: string;
  oauthRedirectUri: string;
  adminEmail: string;
}
