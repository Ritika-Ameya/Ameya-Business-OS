import { API_BASE_URL } from "@/shared/api/config";
import { apiRequest } from "@/shared/api/client";

export interface GoogleDriveStatusDto {
  connected: boolean;
  email: string;
  folderId: string;
  folderName: string;
}

export const googleDriveApi = {
  status: () => apiRequest<GoogleDriveStatusDto>("/google-drive/status"),
  getConnectUrl: () => `${API_BASE_URL}/google-drive/connect`,
};
