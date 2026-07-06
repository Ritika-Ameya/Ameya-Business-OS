export interface GoogleSheetsConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  sheetId: string;
}

export interface GoogleSheetsClientInterface {
  isConfigured(): boolean;
}
