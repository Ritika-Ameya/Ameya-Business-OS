import { API_BASE_URL, DEV_API_KEY } from "@/shared/api/config";
import { tokenStorage } from "@/features/auth/utils/token-storage";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export type FileUploadPayload = {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  contentBase64: string;
};

export function getDriveFileUrl(driveFileId: string): string {
  return `https://drive.google.com/file/d/${driveFileId}/view`;
}

/** Open a Drive file via the authenticated API proxy (works for private files). */
export async function openDriveFile(
  driveFileId: string,
  fileName?: string
): Promise<void> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (DEV_API_KEY) headers["X-DEV-KEY"] = DEV_API_KEY;

  const response = await fetch(`${API_BASE_URL}/uploads/drive/${driveFileId}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Unable to open file (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!opened) {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName?.trim() || "download";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function fileToUploadPayload(file: File): Promise<FileUploadPayload> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File must be 6 MB or smaller.");
  }

  const contentBase64 = await readFileAsBase64(file);
  const name = file.name.trim() || "upload";
  const fileType = name.includes(".")
    ? (name.split(".").pop()?.toLowerCase() ?? "")
    : "";

  return {
    name,
    fileType,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    contentBase64,
  };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      if (!base64) {
        reject(new Error("Failed to read file content."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
