import { ChevronRight } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { masterTabLabels, settingsSectionLabels } from "@/lib/settings-utils";
import type { MasterTab } from "@/types/settings";
import { navItems } from "./navigation";

function segmentToTitle(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSegmentLabel(segment: string, index: number, segments: string[]): string {
  if (segments[0] === "settings" && index === 1) {
    const section = segment as keyof typeof settingsSectionLabels;
    if (section in settingsSectionLabels) {
      return settingsSectionLabels[section];
    }
  }

  const item = navItems.find((nav) => nav.href === `/${segments.slice(0, index + 1).join("/")}`);
  if (item) return item.label;

  return segmentToTitle(segment);
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);

  const masterTab = searchParams.get("tab") as MasterTab | null;
  const reportTab = searchParams.get("tab");
  const masterTabLabel =
    segments[0] === "settings" &&
    segments[1] === "masters" &&
    masterTab &&
    masterTab in masterTabLabels
      ? masterTabLabels[masterTab]
      : null;

  const reportTabLabels: Record<string, string> = {
    revenue: "Revenue Report",
    expense: "Expense Report",
    outstanding: "Outstanding Report",
    renewal: "Renewal Report",
  };

  const reportTabLabel =
    segments[0] === "reports" && reportTab && reportTab in reportTabLabels
      ? reportTabLabels[reportTab]
      : null;

  const trailingLabel = masterTabLabel ?? reportTabLabel;

  return (
    <div className="flex min-h-8 items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = getSegmentLabel(segment, index, segments);
        const isLast = index === segments.length - 1 && !trailingLabel;

        return (
          <div key={href} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link to={href} className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                {label}
              </Link>
            )}
          </div>
        );
      })}
      {trailingLabel ? (
        <div className="flex items-center gap-1">
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{trailingLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
