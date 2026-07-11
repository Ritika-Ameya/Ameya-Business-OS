import type { GoogleDriveClientInterface } from '../interfaces';
import type { DriveFileMetadata, DriveFolderOptions, DriveUploadOptions } from '../types';
import { BaseService } from './base.service';
import type { GoogleDriveClient } from '../integrations/googleDrive/googleDrive.client';

export class GoogleDriveService extends BaseService {
  constructor(private readonly client: GoogleDriveClientInterface) {
    super('GoogleDriveService');
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  async validateConnection(): Promise<boolean> {
    this.logDebug('Validating Google Drive connection');
    return this.client.validateConnection();
  }

  async upload(options: DriveUploadOptions): Promise<DriveFileMetadata> {
    this.logDebug(`Uploading file: ${options.name}`);
    return this.client.upload(options);
  }

  async delete(fileId: string): Promise<void> {
    this.logDebug(`Deleting file: ${fileId}`);
    return this.client.delete(fileId);
  }

  async getMetadata(fileId: string): Promise<DriveFileMetadata> {
    return this.client.getMetadata(fileId);
  }

  async createFolder(options: DriveFolderOptions): Promise<DriveFileMetadata> {
    this.logDebug(`Creating folder: ${options.name}`);
    return this.client.createFolder(options);
  }

  async listFolder(folderId?: string): Promise<DriveFileMetadata[]> {
    return this.client.listFolder(folderId);
  }

  getClient(): GoogleDriveClientInterface {
    return this.client;
  }
}

export const createGoogleDriveService = (client: GoogleDriveClient): GoogleDriveService =>
  new GoogleDriveService(client);
