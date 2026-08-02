import type { ReactNode } from "react";
import { cn } from "@/shared/utils";

/** Shared classes for filter selects/inputs — full width on mobile, auto on sm+. */
export const filterControlClassName =
  "h-11 w-full min-w-0 rounded-xl sm:h-8 sm:w-auto sm:min-w-[8.5rem]";

export const filterDateControlClassName =
  "h-11 w-full min-w-0 rounded-xl sm:h-9 sm:w-auto sm:min-w-[9rem]";

interface FilterToolbarProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

/** Mobile-first filter row: stacks on phones, wraps horizontally from sm up. */
export function FilterToolbar({
  label = "Filters",
  children,
  className,
}: FilterToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {label ? (
        <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}
