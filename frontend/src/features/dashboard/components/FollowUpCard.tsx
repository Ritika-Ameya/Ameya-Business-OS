import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { formatDate } from "@/shared/utils";
import type { FollowUpItem } from "@/features/dashboard/types/dashboard";

interface FollowUpCardProps {
  title: string;
  items: FollowUpItem[];
  emptyMessage: string;
  highlightClassName?: string;
}

function getOpenLink(item: FollowUpItem): string {
  if (item.entityType === "deal" && item.dealId) {
    return `/deals/${item.dealId}`;
  }
  return `/customers/${item.customerId}`;
}

export function FollowUpCard({
  title,
  items,
  emptyMessage,
  highlightClassName,
}: FollowUpCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-2 px-5 py-3 text-sm sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium truncate">{item.company}</p>
                <p className="text-muted-foreground truncate">{item.contactPerson}</p>
                {item.dealTitle && (
                  <p className="text-xs font-medium text-foreground/80 truncate">
                    Deal: {item.dealTitle}
                  </p>
                )}
                {!item.dealTitle && item.entityType === "customer" && (
                  <p className="text-xs text-muted-foreground">Account follow-up</p>
                )}
                <p className="text-xs text-muted-foreground">{item.currentStage}</p>
                <p
                  className={`text-xs ${highlightClassName ?? "text-muted-foreground"}`}
                >
                  Next action: {formatDate(item.nextActionDate)}
                </p>
              </div>
              <div className="flex items-center sm:justify-end">
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link to={getOpenLink(item)}>
                    Open
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
