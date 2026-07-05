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
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
}

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300",
        "hover:border-border hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "absolute -right-3 -top-3 size-20 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60",
          accent
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            accent
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
