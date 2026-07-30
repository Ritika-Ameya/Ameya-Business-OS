import {
  buildDriveImageUrl,
  buildDriveViewUrl,
  uploadDocumentToDrive,
} from '../../../services/documentUpload.service';
import type { UploadCreateInput } from '../validators/upload.validators';

export class UploadService {
  async upload(input: UploadCreateInput) {
    const uploaded = await uploadDocumentToDrive({
      name: input.name,
      mimeType: input.mimeType,
      contentBase64: input.contentBase64,
      makePublic: input.makePublic,
    });

    return {
      id: uploaded.id,
      name: uploaded.name,
      mimeType: uploaded.mimeType,
      size: uploaded.size ?? input.size,
      webViewLink: uploaded.webViewLink ?? buildDriveViewUrl(uploaded.id),
      url: input.makePublic
        ? buildDriveImageUrl(uploaded.id)
        : (uploaded.webViewLink ?? buildDriveViewUrl(uploaded.id)),
    };
  }
}

export const uploadService = new UploadService();
