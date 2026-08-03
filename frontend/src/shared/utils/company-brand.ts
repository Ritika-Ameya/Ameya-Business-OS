export const DEFAULT_APP_NAME = "Ameya Business OS";

const LOGO_CACHE_KEY = "ameya-company-logo-url";
const COMPANY_NAME_CACHE_KEY = "ameya-company-display-name";

/** Company Master name, or product fallback when empty. */
export function getCompanyDisplayName(companyName?: string | null): string {
  const name = companyName?.trim();
  return name || DEFAULT_APP_NAME;
}

/** Persist logo/name so login (unauthenticated) can show the same brand mark. */
export function cacheCompanyBrand(logoUrl?: string | null, companyName?: string | null): void {
  try {
    const logo = logoUrl?.trim() ?? "";
    const name = getCompanyDisplayName(companyName);
    if (logo) localStorage.setItem(LOGO_CACHE_KEY, logo);
    else localStorage.removeItem(LOGO_CACHE_KEY);
    localStorage.setItem(COMPANY_NAME_CACHE_KEY, name);
  } catch {
    // ignore storage failures
  }
}

export function getCachedCompanyLogoUrl(): string | null {
  try {
    return localStorage.getItem(LOGO_CACHE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function getCachedCompanyDisplayName(): string {
  try {
    return localStorage.getItem(COMPANY_NAME_CACHE_KEY)?.trim() || DEFAULT_APP_NAME;
  } catch {
    return DEFAULT_APP_NAME;
  }
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
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
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
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    trimmed,
  ];
}
