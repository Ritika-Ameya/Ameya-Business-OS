import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { CompanyLogoImage } from "@/shared/components/CompanyLogoImage";
import {
  DEFAULT_APP_NAME,
  getCompanyDisplayName,
} from "@/shared/utils/company-brand";
import { cn } from "@/shared/utils";

type CompanyBrandMarkProps = {
  collapsed?: boolean;
  className?: string;
  titleClassName?: string;
  showSubtitleSplit?: boolean;
};

export function CompanyBrandMark({
  collapsed = false,
  className,
  titleClassName,
  showSubtitleSplit = false,
}: CompanyBrandMarkProps) {
  const { company, branding } = useAppConfig();
  const displayName = getCompanyDisplayName(company.companyName);
  const hasLogo = Boolean(branding.logoUrl?.trim());
  const isDefaultName = displayName === DEFAULT_APP_NAME;

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/95 dark:ring-white/20",
          className
        )}
        title={displayName}
      >
        {hasLogo ? (
          <CompanyLogoImage
            logoUrl={branding.logoUrl}
            alt={displayName}
            className="size-full"
          />
        ) : (
          <span className="text-sm font-bold tracking-tight text-slate-700">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 overflow-hidden transition-all duration-300",
        className
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/95 dark:ring-white/20">
        {hasLogo ? (
          <CompanyLogoImage
            logoUrl={branding.logoUrl}
            alt={displayName}
            className="size-full"
          />
        ) : (
          <span className="text-sm font-bold tracking-tight text-slate-700">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        {showSubtitleSplit && isDefaultName ? (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-60">
              Ameya
            </p>
            <h1 className={cn("truncate text-base font-semibold leading-tight", titleClassName)}>
              Business OS
            </h1>
          </>
        ) : (
          <h1 className={cn("truncate text-base font-semibold leading-tight", titleClassName)}>
            {displayName}
          </h1>
        )}
      </div>
    </div>
  );
}
