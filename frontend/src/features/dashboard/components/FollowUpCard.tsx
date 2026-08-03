import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { cn, formatDate } from "@/shared/utils";
import type { FollowUpItem } from "@/features/dashboard/types/dashboard";

const PAGE_SIZE = 5;
const PAGE_BUTTON_WINDOW = 5;

interface FollowUpCardProps {
  title: string;
  items: FollowUpItem[];
  emptyMessage: string;
  highlightClassName?: string;
}

function getOpenLink(item: FollowUpItem): string {
  if (item.entityType === "invoice" && item.invoiceId) {
    return `/invoices/${item.invoiceId}`;
  }
  if (item.entityType === "deal" && item.dealId) {
    return `/deals/${item.dealId}`;
  }
  return `/customers/${item.customerId}`;
}

function getFollowUpKind(item: FollowUpItem): {
  label: string;
  className: string;
} {
  if (item.entityType === "invoice") {
    return {
      label: "Invoice follow-up",
      className:
        "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-100",
    };
  }
  if (item.entityType === "deal") {
    return {
      label: "Deal follow-up",
      className:
        "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-100",
    };
  }
  if (item.recordType === "opportunity") {
    return {
      label: "Opportunity follow-up",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100",
    };
  }
  return {
    label: "Customer follow-up",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100",
  };
}

/** Compact page list with ellipsis for large totals. */
function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= PAGE_BUTTON_WINDOW + 2) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);

  const half = Math.floor(PAGE_BUTTON_WINDOW / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  if (current - half < 2) {
    end = Math.min(total - 1, end + (2 - (current - half)));
  }
  if (current + half > total - 1) {
    start = Math.max(2, start - (current + half - (total - 1)));
  }

  for (let page = start; page <= end; page += 1) {
    pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    const prev = sorted[index - 1];
    if (prev !== undefined && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}

export function FollowUpCard({
  title,
  items,
  emptyMessage,
  highlightClassName,
}: FollowUpCardProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const itemsKey = useMemo(() => items.map((item) => item.id).join("|"), [items]);

  useEffect(() => {
    setPage(1);
  }, [itemsKey]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  const rangeStart = items.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, items.length);
  const pageList = useMemo(
    () => buildPageList(safePage, totalPages),
    [safePage, totalPages]
  );
  const showPagination = items.length > PAGE_SIZE;

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {items.length > 0 ? (
            <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {items.length}
            </span>
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
            {pageItems.map((item) => {
              const kind = getFollowUpKind(item);
              return (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-2 px-5 py-3 text-sm sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        kind.className
                      )}
                    >
                      {kind.label}
                    </span>
                  </div>
                  <p className="truncate font-medium">{item.company}</p>
                  <p className="truncate text-muted-foreground">{item.contactPerson}</p>
                  {item.entityType === "invoice" && (
                    <p className="truncate text-xs font-medium text-sky-700 dark:text-sky-300">
                      Invoice: {item.invoiceNumber || "—"}
                    </p>
                  )}
                  {item.dealTitle && item.entityType !== "invoice" && (
                    <p className="truncate text-xs font-medium text-foreground/80">
                      Deal: {item.dealTitle}
                    </p>
                  )}
                  {item.entityType === "invoice" && item.dealTitle && (
                    <p className="truncate text-xs text-muted-foreground">
                      Deal: {item.dealTitle}
                    </p>
                  )}
                  {item.entityType !== "invoice" && (
                    <p className="text-xs text-muted-foreground">{item.currentStage}</p>
                  )}
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
              );
            })}
          </div>

          {showPagination ? (
            <div className="flex flex-col gap-3 border-t border-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of <span className="font-medium text-foreground">{items.length}</span>
              </p>

              <div className="flex items-center justify-between gap-1.5 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-2.5"
                  disabled={safePage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>

                <div className="flex items-center gap-1">
                  {pageList.map((entry, index) =>
                    entry === "ellipsis" ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-xs text-muted-foreground"
                        aria-hidden
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => setPage(entry)}
                        aria-label={`Page ${entry}`}
                        aria-current={entry === safePage ? "page" : undefined}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                          entry === safePage
                            ? "bg-sky-600 text-white shadow-sm dark:bg-sky-500"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {entry}
                      </button>
                    )
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-2.5"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border/50 px-5 py-2.5">
              <p className="text-xs text-muted-foreground">
                Showing all {items.length} follow-up{items.length === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
