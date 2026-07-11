import type { GoogleServiceAccountConfig } from './googleCommon.interface';

export type { GoogleDriveClientInterface } from './googleClients.interface';

export interface GoogleDriveConfig extends GoogleServiceAccountConfig {
  folderId: string;
}
