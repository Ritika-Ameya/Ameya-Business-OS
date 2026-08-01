import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { moduleAccents } from "@/shared/constants/theme";
import { Button } from "@/shared/ui/button";
import { isNavItemActive } from "@/shared/utils/navigation-utils";
import { cn } from "@/shared/utils";
import { CompanyBrandMark } from "./CompanyBrandMark";
import { navItems, navSections } from "./navigation";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function getRoleLabel(role?: string) {
  const normalized = (role ?? "").toLowerCase();
  if (normalized === "super_admin" || normalized === "admin" || normalized === "owner") {
    return "CEO";
  }
  if (!normalized) return "CEO";
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name?.trim() || "Abhay";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = getRoleLabel(user?.role);

  const handleLogout = async () => {
    // Local clear is sync inside logout — navigate immediately.
    void logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "sidebar-shell sticky top-0 hidden h-svh shrink-0 border-r border-violet-300/35 text-slate-700 transition-all duration-300 lg:flex lg:flex-col dark:border-white/10 dark:text-sidebar-foreground",
        collapsed ? "lg:w-[4.75rem]" : "lg:w-72"
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-violet-300/30 px-3 dark:border-white/10">
        <CompanyBrandMark
          collapsed={collapsed}
          showSubtitleSplit
          className="text-slate-800 dark:text-white"
          titleClassName="text-slate-800 dark:text-white"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-slate-500 hover:bg-violet-500/12 hover:text-slate-800 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-2.5">
        {navSections.map((section) => {
          const items = navItems.filter((item) => item.section === section.id);
          if (items.length === 0) return null;

          return (
            <div key={section.id} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-white/55">
                  {section.label}
                </p>
              )}
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => {
                    const active = isNavItemActive(item.href, pathname) || isActive;
                    return cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      collapsed && "justify-center px-2",
                      active
                        ? "bg-white/75 text-slate-900 shadow-[0_1px_2px_rgba(91,33,182,0.06),0_4px_12px_rgba(91,33,182,0.08)] ring-1 ring-violet-300/45 dark:bg-white/12 dark:text-white dark:ring-white/10 dark:shadow-none"
                        : "text-slate-600 hover:bg-white/55 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/8 dark:hover:text-white"
                    );
                  }}
                >
                  {({ isActive }) => {
                    const active = isNavItemActive(item.href, pathname) || isActive;
                    const accent = moduleAccents[item.accent];
                    return (
                      <>
                        {active && (
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full",
                              accent.solid
                            )}
                            aria-hidden
                          />
                        )}
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                            active
                              ? cn(accent.iconBg, "ring-1 ring-violet-300/40 dark:ring-white/20")
                              : "bg-white/50 text-slate-500 group-hover:bg-white/80 group-hover:text-slate-700 dark:bg-white/5 dark:text-white/70 dark:group-hover:bg-white/10 dark:group-hover:text-white"
                          )}
                        >
                          <item.icon className="size-4" />
                        </span>
                        <span
                          className={cn(
                            "truncate transition-all duration-200",
                            collapsed && "w-0 overflow-hidden opacity-0"
                          )}
                        >
                          {item.label}
                        </span>
                      </>
                    );
                  }}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-violet-300/30 p-3 dark:border-white/10">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border border-violet-300/35 bg-white/65 p-2 shadow-sm dark:border-white/10 dark:bg-white/5",
            collapsed && "justify-center"
          )}
          title={user?.email ?? displayName}
        >
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md"
            aria-hidden
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-slate-800 dark:text-white">
                {displayName}
              </p>
              <p className="truncate text-[11px] leading-tight text-slate-500 dark:text-white/60">
                {roleLabel} · Ameya Innovex
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void handleLogout()}
            aria-label="Sign out"
            title="Sign out"
            className="shrink-0 text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-white/70 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
