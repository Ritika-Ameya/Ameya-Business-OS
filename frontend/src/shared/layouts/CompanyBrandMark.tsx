import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import {
  DEFAULT_APP_NAME,
  getCompanyDisplayName,
  resolveLogoDisplayUrl,
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
  const logoUrl = resolveLogoDisplayUrl(branding.logoUrl);
  const isDefaultName = displayName === DEFAULT_APP_NAME;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 overflow-hidden transition-all duration-300",
        collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
        className
      )}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="size-8 shrink-0 rounded-md object-contain"
        />
      ) : null}
      <div className="min-w-0">
        {showSubtitleSplit && isDefaultName ? (
          <>
            <p className="text-sm text-muted-foreground">Ameya</p>
            <h1 className={cn("truncate text-lg font-semibold", titleClassName)}>
              Business OS
            </h1>
          </>
        ) : (
          <h1 className={cn("truncate text-lg font-semibold leading-tight", titleClassName)}>
            {displayName}
          </h1>
        )}
      </div>
    </div>
  );
}
