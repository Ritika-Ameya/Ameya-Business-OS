import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";
import {
  getCompanyDisplayName,
  resolveLogoDisplayUrl,
} from "@/shared/utils/company-brand";
import { Breadcrumb } from "./Breadcrumb";

type TopbarProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMobileNav: () => void;
};

export function Topbar({ darkMode, onToggleDarkMode, onOpenMobileNav }: TopbarProps) {
  const { company, branding } = useAppConfig();
  const companyName = getCompanyDisplayName(company.companyName);
  const logoUrl = resolveLogoDisplayUrl(branding.logoUrl);

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/55 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-background/55">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
          >
            <Menu />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="size-8 shrink-0 rounded-xl object-contain ring-2 ring-primary/15"
              />
            ) : null}
            <span className="truncate text-sm font-semibold lg:hidden">{companyName}</span>
          </div>
          <div className="hidden md:block">
            <Breadcrumb />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative hidden md:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-primary/60"
              aria-hidden
            />
            <Input
              type="search"
              disabled
              placeholder="Search workspace…"
              aria-label="Global search — coming soon"
              title="Global search coming soon"
              className={cn(
                "h-10 w-48 rounded-2xl border-primary/10 bg-white/80 pl-10 pr-3 shadow-sm",
                "lg:w-64 dark:bg-white/5"
              )}
            />
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-xl text-muted-foreground"
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications — coming soon"
              disabled
              title="Notifications coming soon"
              className="rounded-xl text-muted-foreground"
            >
              <Bell />
            </Button>
            <span
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-background"
              aria-hidden
            />
          </div>

          <div className="mx-1 hidden h-7 w-px bg-border/80 sm:block" aria-hidden />

          <div className="hidden rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:block">
            {currentDate}
          </div>
        </div>
      </div>
      <div className="px-3 pb-3 md:hidden sm:px-6">
        <Breadcrumb />
      </div>
    </header>
  );
}
