import { Menu, Moon, Sun } from "lucide-react";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { CompanyLogoImage } from "@/shared/components/CompanyLogoImage";
import { Button } from "@/shared/ui/button";
import { getCompanyDisplayName } from "@/shared/utils/company-brand";
import { formatDate } from "@/shared/utils/format-date";
import { Breadcrumb } from "./Breadcrumb";
import { NotificationsMenu } from "./NotificationsMenu";
import { WorkspaceSearch } from "./WorkspaceSearch";

type TopbarProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMobileNav: () => void;
};

export function Topbar({ darkMode, onToggleDarkMode, onOpenMobileNav }: TopbarProps) {
  const { company, branding } = useAppConfig();
  const companyName = getCompanyDisplayName(company.companyName);
  const hasLogo = Boolean(branding.logoUrl?.trim());

  const now = new Date();
  const currentDate = formatDate(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/55 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-background/55">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-11 shrink-0 lg:hidden sm:size-8"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
          >
            <Menu />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/80 p-1 ring-1 ring-primary/15 dark:bg-white/10">
              {hasLogo ? (
                <CompanyLogoImage
                  logoUrl={branding.logoUrl}
                  alt={companyName}
                  className="size-full"
                />
              ) : (
                <span className="text-[10px] font-bold tracking-tight">
                  {companyName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="truncate text-sm font-semibold">{companyName}</span>
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <Breadcrumb />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <WorkspaceSearch className="hidden md:block" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="size-11 rounded-xl text-muted-foreground sm:size-8"
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>

          <NotificationsMenu />

          <div className="mx-1 hidden h-7 w-px bg-border/80 sm:block" aria-hidden />

          <div className="hidden rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:block">
            {currentDate}
          </div>
        </div>
      </div>
      <div className="space-y-3 px-3 pb-3 md:hidden sm:px-6">
        <Breadcrumb />
        <WorkspaceSearch className="w-full" />
      </div>
    </header>
  );
}
