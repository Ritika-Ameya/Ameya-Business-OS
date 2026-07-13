import { GitBranch } from "lucide-react";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { formatDate } from "@/shared/utils";
import { getStageById, getStageColorStyle } from "@/features/customers/utils/stage-utils";
import type { Deal } from "@/features/deals/types/deal";

interface DealTimelineTabProps {
  deal: Deal;
}

export function DealTimelineTab({ deal }: DealTimelineTabProps) {
  const { stages } = useAppConfig();

  const entries = [...deal.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Stage changes and follow-up activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
      <h3 className="text-base font-medium">Timeline</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Stage history and follow-up activity
      </p>
      <div className="mt-6 space-y-0">
        {entries.map((entry, index) => {
          const stage = getStageById(stages, entry.stageId);
          const colorStyle = stage ? getStageColorStyle(stage.color) : undefined;

          return (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="flex size-8 items-center justify-center rounded-full"
                  style={colorStyle ?? { backgroundColor: "var(--muted)" }}
                >
                  <GitBranch className="size-4" />
                </div>
                {index < entries.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="mb-6 flex-1 rounded-xl border border-border/50 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{entry.stageName}</p>
                    {entry.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>
                    )}
                    {entry.nextActionDate && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Next action: {formatDate(entry.nextActionDate)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp.split("T")[0])}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
