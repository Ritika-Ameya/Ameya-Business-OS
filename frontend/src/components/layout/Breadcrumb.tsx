import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { navItems } from "./navigation";

function segmentToTitle(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex min-h-8 items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const item = navItems.find((nav) => nav.href === href);
        const label = item?.label ?? segmentToTitle(segment);
        const isLast = index === segments.length - 1;

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
    </div>
  );
}
