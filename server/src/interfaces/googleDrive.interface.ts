export interface GoogleDriveConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  folderId: string;
}

export interface GoogleDriveClientInterface {
  isConfigured(): boolean;
}
