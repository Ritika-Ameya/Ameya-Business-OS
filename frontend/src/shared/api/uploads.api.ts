import { apiRequest } from "@/shared/api/client";
import type { FileUploadPayload } from "@/shared/utils/fileUpload";

export type UploadResultDto = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
  url: string;
};

export const uploadsApi = {
  upload: (body: FileUploadPayload & { makePublic?: boolean }) =>
    apiRequest<UploadResultDto>("/uploads", {
      method: "POST",
      body,
    }),
};
