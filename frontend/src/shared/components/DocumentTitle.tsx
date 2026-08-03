import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppConfigContext } from "@/features/settings/hooks/AppConfigContext";
import {
  DOCUMENT_TITLE_FALLBACK,
  getCachedDocumentCompanyName,
  getDocumentCompanyName,
} from "@/shared/utils/company-brand";
import { formatDocumentTitle } from "@/shared/utils/document-title";

function ensureMetaTag(attr: "name" | "property", key: string): HTMLMetaElement {
  const selector = `meta[${attr}="${key}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  return meta;
}

/**
 * Keeps document.title and related page metadata in sync with the
 * current route and Company Settings name. Renders nothing.
 */
export function DocumentTitle() {
  const { pathname } = useLocation();
  const appConfig = useContext(AppConfigContext);

  const companyName = appConfig
    ? getDocumentCompanyName(appConfig.company.companyName)
    : getCachedDocumentCompanyName();

  useEffect(() => {
    const title = formatDocumentTitle(pathname, companyName);
    document.title = title;

    ensureMetaTag("name", "application-name").content =
      companyName || DOCUMENT_TITLE_FALLBACK;
    ensureMetaTag("property", "og:title").content = title;
    ensureMetaTag("name", "description").content =
      `${companyName || DOCUMENT_TITLE_FALLBACK} business workspace`;
  }, [pathname, companyName]);

  return null;
}
