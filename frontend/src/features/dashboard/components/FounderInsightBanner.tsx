import { Lightbulb } from "lucide-react";
import { getFounderInsight } from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

export function FounderInsightBanner() {
  const { summary } = useDashboard();
  const insight = getFounderInsight(summary);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-card/95 p-5 shadow-card accent-bar-blue sm:px-6 sm:py-5 dark:border-white/10">
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-blue-500/15 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-foreground/90">
          {insight.message}
        </p>
      </div>
    </div>
  );
}
