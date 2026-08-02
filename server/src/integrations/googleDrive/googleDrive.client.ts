import { Readable } from 'stream';

import { google, type drive_v3 } from 'googleapis';

import type { GoogleDriveClientInterface, GoogleDriveConfig } from '../../interfaces';
import type { DriveFileMetadata, DriveFolderOptions, DriveUploadOptions } from '../../types';
import { getGoogleRequestOptions } from '../google/googleAccount.config';
import { wrapGoogleOperation } from '../google/googleError.mapper';
import { withGoogleRetry } from '../google/googleRetry.util';
import type { GoogleDriveOAuthService } from './googleDriveOAuth.service';

const mapDriveFile = (file: drive_v3.Schema$File): DriveFileMetadata => ({
  id: file.id ?? '',
  name: file.name ?? '',
  mimeType: file.mimeType ?? '',
  size: file.size ? Number(file.size) : undefined,
  createdTime: file.createdTime ?? undefined,
  modifiedTime: file.modifiedTime ?? undefined,
  webViewLink: file.webViewLink ?? undefined,
  webContentLink: file.webContentLink ?? undefined,
  parents: file.parents ?? undefined,
});

const DRIVE_FILE_FIELDS =
  'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents';

export class GoogleDriveClient implements GoogleDriveClientInterface {
  private readonly config: GoogleDriveConfig;
  private readonly oauthService: GoogleDriveOAuthService;
  private readonly requestOptions: ReturnType<typeof getGoogleRequestOptions>;

  constructor(config: GoogleDriveConfig, oauthService: GoogleDriveOAuthService) {
    this.config = config;
    this.oauthService = oauthService;
    this.requestOptions = getGoogleRequestOptions();
  }

  isConfigured(): boolean {
    return this.oauthService.isConfigured();
  }

  private async getDriveApi(): Promise<drive_v3.Drive> {
    const auth = await this.oauthService.getAuthorizedClient();
    return google.drive({ version: 'v3', auth: auth });
  }

  async validateConnection(): Promise<boolean> {
    if (!this.oauthService.isConfigured()) {
      throw new Error(
        'Google Drive OAuth credentials are not configured (CLIENT_ID / CLIENT_SECRET / REDIRECT_URI)',
      );
    }

    const hasToken = await this.oauthService.hasStoredRefreshToken();
    if (!hasToken) {
      throw new Error(
        'Google Drive is not connected — Super Admin must complete OAuth in Settings → Company',
      );
    }

    try {
      await this.listFolder(this.config.folderId);
      return true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      throw new Error(
        `Google Drive folder check failed for GOOGLE_DRIVE_FOLDER_ID (${this.config.folderId}): ${detail}`,
      );
    }
  }

  async upload(options: DriveUploadOptions): Promise<DriveFileMetadata> {
    return wrapGoogleOperation(`Google Drive upload(${options.name})`, async () =>
      withGoogleRetry(async () => {
        const drive = await this.getDriveApi();
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
            fields: DRIVE_FILE_FIELDS,
          },
          { timeout: this.requestOptions.timeout },
        );

        const fileId = response.data.id;
        if (!fileId) {
          throw new Error('Google Drive upload did not return a file ID');
        }

        // Anyone with the link can open, edit, and download (no "Request Access").
        await drive.permissions.create(
          {
            fileId,
            requestBody: {
              type: 'anyone',
              role: 'writer',
            },
          },
          { timeout: this.requestOptions.timeout },
        );

        const metadataResponse = await drive.files.get(
          {
            fileId,
            fields: DRIVE_FILE_FIELDS,
          },
          { timeout: this.requestOptions.timeout },
        );

        return mapDriveFile(metadataResponse.data);
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async download(fileId: string): Promise<{ content: Buffer; mimeType: string; name: string }> {
    return wrapGoogleOperation(`Google Drive download(${fileId})`, async () =>
      withGoogleRetry(async () => {
        const drive = await this.getDriveApi();
        const metadataResponse = await drive.files.get(
          {
            fileId,
            fields: 'id,name,mimeType',
          },
          { timeout: this.requestOptions.timeout },
        );

        const mediaResponse = await drive.files.get(
          {
            fileId,
            alt: 'media',
          },
          {
            timeout: this.requestOptions.timeout,
            responseType: 'arraybuffer',
          },
        );

        const content = Buffer.from(mediaResponse.data as ArrayBuffer);
        return {
          content,
          mimeType: metadataResponse.data.mimeType || 'application/octet-stream',
          name: metadataResponse.data.name || fileId,
        };
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async delete(fileId: string): Promise<void> {
    await wrapGoogleOperation(`Google Drive delete(${fileId})`, async () =>
      withGoogleRetry(async () => {
        const drive = await this.getDriveApi();
        await drive.files.delete({ fileId }, { timeout: this.requestOptions.timeout });
      }, { maxRetries: this.requestOptions.maxRetries }),
    );
  }

  async getMetadata(fileId: string): Promise<DriveFileMetadata> {
    return wrapGoogleOperation(`Google Drive getMetadata(${fileId})`, async () =>
      withGoogleRetry(async () => {
        const drive = await this.getDriveApi();
        const response = await drive.files.get(
          {
            fileId,
            fields: DRIVE_FILE_FIELDS,
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
        const drive = await this.getDriveApi();
        const response = await drive.files.create(
          {
            requestBody: {
              name: options.name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [options.parentFolderId ?? this.config.folderId],
            },
            fields: 'id,name,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents',
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
        const drive = await this.getDriveApi();
        const response = await drive.files.list(
          {
            q: `'${targetFolderId}' in parents and trashed = false`,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents)',
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
