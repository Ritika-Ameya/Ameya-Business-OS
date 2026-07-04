import { Building2, Database, IndianRupee, SlidersHorizontal } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "@/shared/components/PageHeader";
import { cn } from "@/shared/utils";
import { settingsSectionLabels } from "@/lib/settings-utils";

const navItems = [
  { to: "/settings/company", label: settingsSectionLabels.company, icon: Building2 },
  { to: "/settings/masters", label: settingsSectionLabels.masters, icon: Database },
  { to: "/settings/finance", label: settingsSectionLabels.finance, icon: IndianRupee },
  {
    to: "/settings/preferences",
    label: settingsSectionLabels.preferences,
    icon: SlidersHorizontal,
  },
] as const;

export function SettingsLayout() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Application configuration and master data management."
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
