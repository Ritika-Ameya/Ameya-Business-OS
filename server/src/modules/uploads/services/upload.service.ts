import {
  buildDriveImageUrl,
  buildDriveViewUrl,
  uploadDocumentToDrive,
} from '../../../services/documentUpload.service';
import { googleDriveService } from '../../../integrations';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import type { UploadCreateInput } from '../validators/upload.validators';

export class UploadService {
  async upload(input: UploadCreateInput) {
    const uploaded = await uploadDocumentToDrive({
      name: input.name,
      mimeType: input.mimeType,
      contentBase64: input.contentBase64,
      makePublic: input.makePublic,
    });

    // Prefer a direct image URL so <img> previews work (webViewLink is an HTML page).
    const imageUrl = buildDriveImageUrl(uploaded.id);

    return {
      id: uploaded.id,
      name: uploaded.name,
      mimeType: uploaded.mimeType,
      size: uploaded.size ?? input.size,
      webViewLink: uploaded.webViewLink ?? buildDriveViewUrl(uploaded.id),
      webContentLink: uploaded.webContentLink ?? '',
      url: imageUrl,
    };
  }

  async downloadDriveFile(fileId: string) {
    const id = fileId.trim();
    if (!id) {
      throw new ValidationError('File ID is required');
    }
    if (!googleDriveService.isConfigured()) {
      throw new ValidationError('Google Drive is not configured');
    }

    try {
      return await googleDriveService.download(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File not found';
      throw new NotFoundError(message);
    }
  }
}

export const uploadService = new UploadService();
