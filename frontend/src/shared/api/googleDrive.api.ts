import { apiRequest } from "@/shared/api/client";

export interface GoogleDriveStatusDto {
  connected: boolean;
  email: string;
  folderId: string;
  folderName: string;
  oauthConfigured: boolean;
}

export interface GoogleDriveConnectDto {
  alreadyConnected: boolean;
  authorizationUrl: string | null;
  status: GoogleDriveStatusDto;
}

export const googleDriveApi = {
  status: () => apiRequest<GoogleDriveStatusDto>("/google-drive/status"),

  /** Authenticated Super Admin call — returns Google OAuth URL to open. */
  connect: () =>
    apiRequest<GoogleDriveConnectDto>("/google-drive/connect", {
      method: "GET",
    }),
};
