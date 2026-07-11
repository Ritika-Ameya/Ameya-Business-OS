import { Readable } from 'stream';

import { google, type drive_v3 } from 'googleapis';

import { GOOGLE_SCOPES } from '../../constants';
import type { GoogleDriveClientInterface, GoogleDriveConfig } from '../../interfaces';
import type { DriveFileMetadata, DriveFolderOptions, DriveUploadOptions } from '../../types';
import type { GoogleAuthService } from '../google/googleAuth.service';
import { googleAuthService } from '../google/googleAuth.service';
import { getGoogleRequestOptions } from '../google/googleAccount.config';
import { wrapGoogleOperation } from '../google/googleError.mapper';
import { withGoogleRetry } from '../google/googleRetry.util';

const mapDriveFile = (file: drive_v3.Schema$File): DriveFileMetadata => ({
  id: file.id ?? '',
  name: file.name ?? '',
  mimeType: file.mimeType ?? '',
  size: file.size ? Number(file.size) : undefined,
  createdTime: file.createdTime ?? undefined,
  modifiedTime: file.modifiedTime ?? undefined,
  webViewLink: file.webViewLink ?? undefined,
  parents: file.parents ?? undefined,
});

export class GoogleDriveClient implements GoogleDriveClientInterface {
  private readonly config: GoogleDriveConfig;
  private readonly authService: GoogleAuthService;
  private readonly requestOptions: ReturnType<typeof getGoogleRequestOptions>;

  constructor(config: GoogleDriveConfig, authService: GoogleAuthService = googleAuthService) {
    this.config = config;
    this.authService = authService;
    this.requestOptions = getGoogleRequestOptions();
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.projectId &&
        this.config.clientEmail &&
        this.config.privateKey &&
        this.config.folderId,
    );
  }

  private getDriveApi(): drive_v3.Drive {
    const auth = this.authService.getJwtClient([GOOGLE_SCOPES.DRIVE]);
    return google.drive({ version: 'v3', auth: auth });
  }

  async validateConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.listFolder(this.config.folderId);
      return true;
    } catch {
      return false;
    }
  }

  async upload(options: DriveUploadOptions): Promise<DriveFileMetadata> {
    return wrapGoogleOperation(`Google Drive upload(${options.name})`, async () =>
      withGoogleRetry(async () => {
        const drive = this.getDriveApi();
        const content =
          typeof options.content === 'string' ? Buffer.from(options.content) : options.content;

        const response = await drive.files.create(
          {
            requestBody: {
              name: options.name,
              mimeType: options.mimeType,
              parents: [options.folderId ?? this.config.folderId],
            },
            media: {
              mimeType: options.mimeType,
              body: Readable.from(content),
            },
            fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents',
          },
          { timeout: this.requestOptions.timeout },
        );

        return mapDriveFile(response.data);
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async delete(fileId: string): Promise<void> {
    await wrapGoogleOperation(`Google Drive delete(${fileId})`, async () =>
      withGoogleRetry(async () => {
        const drive = this.getDriveApi();
        await drive.files.delete({ fileId }, { timeout: this.requestOptions.timeout });
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async getMetadata(fileId: string): Promise<DriveFileMetadata> {
    return wrapGoogleOperation(`Google Drive getMetadata(${fileId})`, async () =>
      withGoogleRetry(async () => {
        const drive = this.getDriveApi();
        const response = await drive.files.get(
          {
            fileId,
            fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents',
          },
          { timeout: this.requestOptions.timeout },
        );

        return mapDriveFile(response.data);
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async createFolder(options: DriveFolderOptions): Promise<DriveFileMetadata> {
    return wrapGoogleOperation(`Google Drive createFolder(${options.name})`, async () =>
      withGoogleRetry(async () => {
        const drive = this.getDriveApi();
        const response = await drive.files.create(
          {
            requestBody: {
              name: options.name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [options.parentFolderId ?? this.config.folderId],
            },
            fields: 'id,name,mimeType,createdTime,modifiedTime,webViewLink,parents',
          },
          { timeout: this.requestOptions.timeout },
        );

        return mapDriveFile(response.data);
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async listFolder(folderId?: string): Promise<DriveFileMetadata[]> {
    const targetFolderId = folderId ?? this.config.folderId;

    return wrapGoogleOperation(`Google Drive listFolder(${targetFolderId})`, async () =>
      withGoogleRetry(async () => {
        const drive = this.getDriveApi();
        const response = await drive.files.list(
          {
            q: `'${targetFolderId}' in parents and trashed = false`,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents)',
            pageSize: 100,
            orderBy: 'name',
          },
          { timeout: this.requestOptions.timeout },
        );

        return (response.data.files ?? []).map(mapDriveFile);
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }
}
