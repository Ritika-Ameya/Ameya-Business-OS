/**
 * Google Sheets integration placeholder.
 * API connection will be implemented in Sprint 1.
 */
import type { GoogleSheetsClientInterface, GoogleSheetsConfig } from '../../interfaces';

export class GoogleSheetsClient implements GoogleSheetsClientInterface {
  private readonly config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.projectId &&
        this.config.clientEmail &&
        this.config.privateKey &&
        this.config.sheetId,
    );
  }
}
