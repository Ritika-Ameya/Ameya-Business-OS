export const DEFAULT_APP_NAME = "Ameya Business OS";

/** Company Master name, or product fallback when empty. */
export function getCompanyDisplayName(companyName?: string | null): string {
  const name = companyName?.trim();
  return name || DEFAULT_APP_NAME;
}

/** Extract a Google Drive file id from common Drive URL shapes. */
export function extractDriveFileId(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return fileMatch[1];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1] && trimmed.includes("drive.google.com")) return idMatch[1];

  const thumbMatch = trimmed.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (thumbMatch?.[1]) return thumbMatch[1];

  return null;
}

/**
 * Convert Google Drive /view links to a browser-friendly image URL.
 * Prefer the thumbnail endpoint — `uc?export=view` often fails inside <img>.
 */
export function resolveLogoDisplayUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }

  return trimmed;
}

/** Ordered fallbacks when a Drive hotlink fails to render. */
export function resolveLogoFallbackUrls(url?: string | null): string[] {
  const trimmed = url?.trim();
  if (!trimmed) return [];

  const fileId = extractDriveFileId(trimmed);
  if (!fileId) return [trimmed];

  return [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    trimmed,
  ];
}
