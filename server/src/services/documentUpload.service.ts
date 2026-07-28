import { googleDriveService } from '../integrations';
import type { DriveFileMetadata } from '../types';
import { ValidationError } from '../utils/AppError';
import { getExtension, sanitizeFilename } from '../utils/file.util';

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export interface DocumentUploadInput {
  name: string;
  mimeType?: string;
  contentBase64: string;
  makePublic?: boolean;
}

const decodeBase64Content = (contentBase64: string): Buffer => {
  const cleaned = contentBase64.replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleaned) {
    throw new ValidationError('File content is required');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleaned, 'base64');
  } catch {
    throw new ValidationError('Invalid file content encoding');
  }

  if (buffer.length === 0) {
    throw new ValidationError('File content is empty');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ValidationError('File exceeds the 6 MB upload limit');
  }

  return buffer;
};

export const uploadDocumentToDrive = async (
  input: DocumentUploadInput,
): Promise<DriveFileMetadata> => {
  if (!googleDriveService.isConfigured()) {
    throw new ValidationError('Google Drive is not configured');
  }

  const content = decodeBase64Content(input.contentBase64);
  const safeName = sanitizeFilename(input.name.trim()) || 'upload';
  const mimeType = input.mimeType?.trim() || 'application/octet-stream';

  return googleDriveService.upload({
    name: safeName,
    mimeType,
    content,
    makePublic: input.makePublic,
  });
};

export const deleteDriveFileQuietly = async (driveFileId: string): Promise<void> => {
  const id = driveFileId.trim();
  if (!id) return;

  try {
    await googleDriveService.delete(id);
  } catch {
    // Keep sheet metadata cleanup resilient if Drive delete fails.
  }
};

export const deriveFileType = (name: string, fileType?: string): string => {
  const provided = fileType?.trim();
  if (provided) return provided;
  return getExtension(name);
};

export const buildDriveViewUrl = (driveFileId: string): string =>
  `https://drive.google.com/file/d/${driveFileId}/view`;

export const buildDriveImageUrl = (driveFileId: string): string =>
  `https://drive.google.com/uc?export=view&id=${driveFileId}`;
