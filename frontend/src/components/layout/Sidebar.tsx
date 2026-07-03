import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navItems } from "./navigation";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden border-r border-border/70 bg-card/70 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "lg:w-20" : "lg:w-72"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <p className="text-sm text-muted-foreground">Ameya</p>
          <h1 className="text-lg font-semibold">Business OS</h1>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            <span
              className={cn(
                "truncate transition-all duration-200",
                collapsed && "w-0 opacity-0"
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
