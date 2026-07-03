import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <div className="hidden md:block">
            <Breadcrumb />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className={cn(
                "h-9 w-48 rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50",
                "lg:w-60"
              )}
            />
          </div>

          <Button variant="outline" size="icon-sm" onClick={onToggleDarkMode} aria-label="Toggle theme">
            {darkMode ? <Sun /> : <Moon />}
          </Button>

          <Button variant="outline" size="icon-sm" aria-label="Notifications">
            <Bell />
          </Button>

          <div className="hidden rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground sm:block">
            {currentDate}
          </div>

          <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            AR
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <Breadcrumb />
      </div>
    </header>
  );
}
