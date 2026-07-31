export const DEFAULT_APP_NAME = "Ameya Business OS";

/** Company Master name, or product fallback when empty. */
export function getCompanyDisplayName(companyName?: string | null): string {
  const name = companyName?.trim();
  return name || DEFAULT_APP_NAME;
}

/**
 * Convert Google Drive /view links to a direct image URL usable in <img>.
 * Leaves already-direct or non-Drive URLs unchanged.
 */
export function resolveLogoDisplayUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && trimmed.includes("drive.google.com") && !trimmed.includes("export=view")) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }

  return trimmed;
}
