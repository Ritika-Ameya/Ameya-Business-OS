import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "./Breadcrumb";

type TopbarProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMobileNav: () => void;
};

export function Topbar({ darkMode, onToggleDarkMode, onOpenMobileNav }: TopbarProps) {
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl dark:bg-background/90">
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
          <div className="hidden md:block">
            <Breadcrumb />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              disabled
              placeholder="Global search (coming soon)"
              aria-label="Global search — coming soon"
              title="Global search coming soon"
              className={cn(
                "h-9 w-44 rounded-xl border-border/70 bg-muted/30 pl-9 pr-3 dark:bg-muted/20",
                "lg:w-56"
              )}
            />
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Notifications — coming soon"
            disabled
            title="Notifications coming soon"
          >
            <Bell />
          </Button>

          <div className="hidden rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground dark:bg-card/80 sm:block">
            {currentDate}
          </div>

          <div
            className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-hidden
          >
            AR
          </div>
        </div>
      </div>
      <div className="px-3 pb-3 md:hidden sm:px-6">
        <Breadcrumb />
      </div>
    </header>
  );
}
