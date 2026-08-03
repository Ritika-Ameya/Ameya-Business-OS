import { useMemo, useState } from "react";
import { FollowUpCard } from "@/features/dashboard/components/FollowUpCard";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type { FollowUpItem } from "@/features/dashboard/types/dashboard";
import { cn } from "@/shared/utils";

type FollowUpRange =
  | "all"
  | "overdue"
  | "today"
  | "tomorrow"
  | "this_week"
  | "this_month"
  | "upcoming";

const RANGE_OPTIONS: Array<{ id: FollowUpRange; label: string }> = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "upcoming", label: "Upcoming" },
];

function toDateKey(value: string): string {
  return value.trim().slice(0, 10);
}

function localTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addLocalDaysKey(days: number, from = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Monday-start week bounds as YYYY-MM-DD. */
function getThisWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addLocalDaysKey(mondayOffset, now);
  const end = addLocalDaysKey(mondayOffset + 6, now);
  return { start, end };
}

function getThisMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function sortByDate(items: FollowUpItem[]): FollowUpItem[] {
  return [...items].sort((a, b) =>
    toDateKey(a.nextActionDate).localeCompare(toDateKey(b.nextActionDate))
  );
}

function filterByRange(items: FollowUpItem[], range: FollowUpRange): FollowUpItem[] {
  const today = localTodayKey();
  const tomorrow = addLocalDaysKey(1);
  const week = getThisWeekBounds();
  const month = getThisMonthBounds();

  const filtered = items.filter((item) => {
    const date = toDateKey(item.nextActionDate);
    if (!date) return false;

    switch (range) {
      case "all":
        return true;
      case "overdue":
        return date < today;
      case "today":
        return date === today;
      case "tomorrow":
        return date === tomorrow;
      case "this_week":
        return date >= week.start && date <= week.end;
      case "this_month":
        return date >= month.start && date <= month.end;
      case "upcoming":
        return date > tomorrow;
      default:
        return true;
    }
  });

  return sortByDate(filtered);
}

export function FollowUpWidgets() {
  const { summary } = useDashboard();
  const [range, setRange] = useState<FollowUpRange>("upcoming");

  const todaysItems = (summary?.followUps.today ?? []) as FollowUpItem[];
  const tomorrowsItems = (summary?.followUps.tomorrow ?? []) as FollowUpItem[];
  const overdueItems = (summary?.followUps.overdue ?? []) as FollowUpItem[];
  const upcomingItems = (summary?.followUps.upcoming ?? []) as FollowUpItem[];

  const allItems = useMemo(
    () => sortByDate([...overdueItems, ...todaysItems, ...tomorrowsItems, ...upcomingItems]),
    [overdueItems, todaysItems, tomorrowsItems, upcomingItems]
  );

  const filteredItems = useMemo(
    () => filterByRange(allItems, range),
    [allItems, range]
  );

  const emptyMessage =
    range === "upcoming"
      ? "No upcoming follow-ups beyond tomorrow"
      : range === "all"
        ? "No follow-ups scheduled"
        : `No follow-ups in “${RANGE_OPTIONS.find((option) => option.id === range)?.label ?? range}”`;

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold tracking-tight">Follow Ups</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <FollowUpCard
          title="Today's Follow Ups"
          items={todaysItems}
          emptyMessage="No follow ups scheduled for today"
        />
        <FollowUpCard
          title="Tomorrow's Follow Ups"
          items={tomorrowsItems}
          emptyMessage="No follow ups scheduled for tomorrow"
        />
        <FollowUpCard
          title="Overdue Follow Ups"
          items={overdueItems}
          emptyMessage="No overdue follow ups"
          highlightClassName="text-red-600 dark:text-red-400"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Upcoming Follow Ups</h3>
            <p className="text-xs text-muted-foreground">
              Detailed list with filters across all date ranges
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {filteredItems.length} of {allItems.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => {
            const count = filterByRange(allItems, option.id).length;
            const active = range === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-sky-500/40 bg-sky-500/15 text-sky-800 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-100"
                    : "border-border/70 bg-background text-muted-foreground hover:border-sky-500/30 hover:text-foreground"
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    active
                      ? "bg-sky-600/15 text-sky-900 dark:bg-sky-300/20 dark:text-sky-50"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <FollowUpCard
          title={
            RANGE_OPTIONS.find((option) => option.id === range)?.label
              ? `${RANGE_OPTIONS.find((option) => option.id === range)?.label} Details`
              : "Follow-up Details"
          }
          items={filteredItems}
          emptyMessage={emptyMessage}
          highlightClassName={
            range === "overdue" ? "text-red-600 dark:text-red-400" : undefined
          }
        />
      </div>
    </section>
  );
}
