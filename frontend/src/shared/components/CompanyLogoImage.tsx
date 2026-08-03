import { useEffect, useState } from "react";
import { API_BASE_URL, DEV_API_KEY } from "@/shared/api/config";
import { tokenStorage } from "@/features/auth/utils/token-storage";
import {
  extractDriveFileId,
  resolveLogoDisplayUrl,
  resolveLogoFallbackUrls,
} from "@/shared/utils/company-brand";
import { cn } from "@/shared/utils";

type CompanyLogoImageProps = {
  logoUrl?: string | null;
  alt?: string;
  className?: string;
};

/**
 * Renders company logos reliably.
 * Drive files are fetched through the authenticated API proxy as a blob,
 * with public Drive thumbnail fallbacks if the proxy is unavailable.
 */
export function CompanyLogoImage({
  logoUrl,
  alt = "",
  className,
}: CompanyLogoImageProps) {
  const [src, setSrc] = useState<string | null>(() => resolveLogoDisplayUrl(logoUrl));
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const fileId = extractDriveFileId(logoUrl);

    setFallbackIndex(0);
    setSrc(resolveLogoDisplayUrl(logoUrl));

    if (!fileId) {
      return () => {
        cancelled = true;
      };
    }

    const loadViaProxy = async () => {
      try {
        const headers: Record<string, string> = {};
        const token = tokenStorage.getAccessToken();
        if (!token && !DEV_API_KEY) {
          // Login / public surfaces rely on Drive thumbnail fallbacks.
          return;
        }
        if (token) headers.Authorization = `Bearer ${token}`;
        if (DEV_API_KEY) headers["X-DEV-KEY"] = DEV_API_KEY;

        const response = await fetch(`${API_BASE_URL}/uploads/drive/${fileId}`, {
          headers,
        });
        if (!response.ok) throw new Error(`Logo proxy failed (${response.status})`);

        const blob = await response.blob();
        if (!blob.type.startsWith("image/") && blob.size === 0) {
          throw new Error("Empty logo response");
        }

        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        // Keep public Drive fallbacks from resolveLogoDisplayUrl / onError.
      }
    };

    void loadViaProxy();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [logoUrl]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain", className)}
      onError={() => {
        const fallbacks = resolveLogoFallbackUrls(logoUrl);
        const nextIndex = fallbackIndex + 1;
        if (nextIndex < fallbacks.length) {
          setFallbackIndex(nextIndex);
          setSrc(fallbacks[nextIndex] ?? null);
        } else {
          setSrc(null);
        }
      }}
    />
  );
}
