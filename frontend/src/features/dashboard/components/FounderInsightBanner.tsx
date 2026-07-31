import { Lightbulb } from "lucide-react";
import {
  formatTodayDate,
  getFounderInsight,
  getTimeOfDayGreeting,
} from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import {
  getCompanyDisplayName,
  resolveLogoDisplayUrl,
} from "@/shared/utils/company-brand";

export function FounderInsightBanner() {
  const { summary } = useDashboard();
  const { company, branding } = useAppConfig();
  const insight = getFounderInsight(summary);
  const companyName = getCompanyDisplayName(company.companyName);
  const logoUrl = resolveLogoDisplayUrl(branding.logoUrl);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-muted/50 blur-3xl" />

      <div className="relative space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="size-10 shrink-0 rounded-lg object-contain"
              />
            ) : null}
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Welcome to {companyName}
            </p>
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {getTimeOfDayGreeting()}, Abhay 👋
          </h2>
          <p className="text-sm text-muted-foreground">{formatTodayDate()}</p>
          <p className="max-w-lg text-sm font-medium text-foreground/80">
            Lead with clarity.
            <span className="text-muted-foreground"> Every number tells a story.</span>
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {insight.message}
          </p>
        </div>
      </div>
    </div>
  );
}
