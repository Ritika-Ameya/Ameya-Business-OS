export interface GoogleServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface GoogleClientInterface {
  isConfigured(): boolean;
}
