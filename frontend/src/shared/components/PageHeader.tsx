import type { ReactNode } from "react";
import { cn } from "@/shared/utils";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-[1.85rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {subtitle}
        </p>
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center [&_button]:min-h-11 [&_button]:w-full sm:[&_button]:min-h-9 sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  /** Optional colored top border utility class e.g. accent-bar-blue */
  barClass?: string;
}

export function StatCard({ label, value, icon, accent, barClass }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative flex h-full overflow-hidden rounded-2xl border border-white/70 bg-card/95 p-4 shadow-card transition-all duration-300 sm:p-5 dark:border-white/10",
        "hover:-translate-y-1 hover:shadow-elevated",
        barClass
      )}
    >
      <div
        className={cn(
          "absolute -right-4 -top-4 size-28 rounded-full opacity-60 blur-3xl transition-opacity group-hover:opacity-90",
          accent
        )}
      />
      <div className="relative flex w-full items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-inset ring-black/5 sm:size-12 dark:ring-white/10",
            accent
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
