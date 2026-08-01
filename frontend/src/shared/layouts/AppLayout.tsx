import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { THEME_STORAGE_KEY } from "@/shared/constants/theme";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark") {
      return true;
    }
    if (stored === "light") {
      return false;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className="h-svh overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((value) => !value)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
            <div className="page-enter mx-auto max-w-[1600px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
