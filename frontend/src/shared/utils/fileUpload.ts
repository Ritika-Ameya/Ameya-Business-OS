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
