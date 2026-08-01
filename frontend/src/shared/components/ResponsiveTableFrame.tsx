import type { ReactNode } from "react";
import { cn } from "@/shared/utils";

interface ResponsiveTableFrameProps {
  children: ReactNode;
  className?: string;
}

/** Horizontal scroll wrapper for data tables on small screens. */
export function ResponsiveTableFrame({
  children,
  className,
}: ResponsiveTableFrameProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-white/70 bg-card/95 shadow-card dark:border-white/10 [-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      {children}
    </div>
  );
}
