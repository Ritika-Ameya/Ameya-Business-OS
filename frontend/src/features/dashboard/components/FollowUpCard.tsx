import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { formatDate } from "@/shared/utils";
import type { FollowUpItem } from "@/features/dashboard/types/dashboard";

const PAGE_SIZE = 5;

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
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {items.length > 0 ? (
            <span className="text-xs text-muted-foreground">{items.length}</span>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/50">
            {pageItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-2 px-5 py-3 text-sm sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-medium">{item.company}</p>
                  <p className="truncate text-muted-foreground">{item.contactPerson}</p>
                  {item.dealTitle && (
                    <p className="truncate text-xs font-medium text-foreground/80">
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

          {items.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-2 border-t border-border/50 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={safePage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
