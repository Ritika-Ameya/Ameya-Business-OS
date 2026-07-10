import { GitBranch, Receipt, Wallet } from "lucide-react";
import { useMemo } from "react";
import { formatDate } from "@/shared/utils";
import { useEntityActivities } from "@/shared/hooks/use-activities";
import type { ActivityEntityType, ActivityEntry } from "@/shared/types/activity";

interface ActivityTimelineProps {
  entityType: ActivityEntityType;
  entityId: string;
  emptyMessage?: string;
  additionalEntries?: ActivityEntry[];
}

function ActivityIcon({ action }: { action: string }) {
  if (action === "payment_recorded") {
    return <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (action === "invoice_generated") {
    return <Receipt className="size-4 text-blue-600 dark:text-blue-400" />;
  }
  return <GitBranch className="size-4" />;
}

function sortEntries(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function ActivityTimeline({
  entityType,
  entityId,
  emptyMessage = "Activity history will appear here as actions are recorded.",
  additionalEntries = [],
}: ActivityTimelineProps) {
  const storeEntries = useEntityActivities(entityType, entityId);

  const entries = useMemo(() => {
    const seen = new Set(storeEntries.map((entry) => entry.id));
    const merged = [
      ...storeEntries,
      ...additionalEntries.filter((entry) => !seen.has(entry.id)),
    ];
    return sortEntries(merged);
  }, [storeEntries, additionalEntries]);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
      <h3 className="text-base font-medium">Timeline</h3>
      <p className="mt-1 text-sm text-muted-foreground">Chronological activity history</p>
      <div className="mt-6 space-y-0">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <ActivityIcon action={entry.action} />
              </div>
              {index < entries.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="mb-6 flex-1 rounded-xl border border-border/50 bg-background/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{entry.title}</p>
                  {entry.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                  )}
                  {entry.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p>
                  )}
                  {entry.relatedRecord && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Related: {entry.relatedRecord}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">By {entry.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.timestamp.split("T")[0])}{" "}
                  {new Date(entry.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
