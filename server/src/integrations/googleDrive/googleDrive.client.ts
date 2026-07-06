/**
 * Google Drive integration placeholder.
 * API connection will be implemented in Sprint 1.
 */
import type { GoogleDriveClientInterface, GoogleDriveConfig } from '../../interfaces';

export class GoogleDriveClient implements GoogleDriveClientInterface {
  private readonly config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.projectId &&
        this.config.clientEmail &&
        this.config.privateKey &&
        this.config.folderId,
    );
  }
}
