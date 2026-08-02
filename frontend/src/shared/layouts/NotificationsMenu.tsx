import { AlertTriangle, Bell, CalendarClock, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type { FollowUpItem } from "@/features/dashboard/types/dashboard";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { formatDate } from "@/shared/utils";

type NotificationBucket = "overdue" | "today" | "tomorrow";

type NotificationItem = FollowUpItem & {
  bucket: NotificationBucket;
};

function getOpenLink(item: FollowUpItem): string {
  if (item.entityType === "deal" && item.dealId) {
    return `/deals/${item.dealId}`;
  }
  return `/customers/${item.customerId}`;
}

function bucketLabel(bucket: NotificationBucket): string {
  switch (bucket) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Today";
    case "tomorrow":
      return "Tomorrow";
  }
}

function bucketIcon(bucket: NotificationBucket) {
  switch (bucket) {
    case "overdue":
      return AlertTriangle;
    case "today":
      return Clock3;
    case "tomorrow":
      return CalendarClock;
  }
}

export function NotificationsMenu() {
  const { summary, loading } = useDashboard();

  const items: NotificationItem[] = [
    ...(summary?.followUps.overdue ?? []).map((item) => ({
      ...item,
      bucket: "overdue" as const,
    })),
    ...(summary?.followUps.today ?? []).map((item) => ({
      ...item,
      bucket: "today" as const,
    })),
    ...(summary?.followUps.tomorrow ?? []).map((item) => ({
      ...item,
      bucket: "tomorrow" as const,
    })),
  ];

  const count = items.length;
  const preview = items.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            count > 0 ? `Notifications, ${count} pending` : "Notifications"
          }
          className="relative size-11 rounded-xl text-muted-foreground sm:size-8"
        >
          <Bell />
          {count > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-background">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
          <span>Notifications</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {loading ? "Loading…" : `${count} follow-up${count === 1 ? "" : "s"}`}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />

        {preview.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {loading ? "Loading follow-ups…" : "No follow-ups need attention"}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {preview.map((item) => {
              const Icon = bucketIcon(item.bucket);
              return (
                <DropdownMenuItem key={`${item.bucket}-${item.id}`} asChild>
                  <Link
                    to={getOpenLink(item)}
                    className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5"
                  >
                    <span
                      className={
                        item.bucket === "overdue"
                          ? "mt-0.5 text-rose-500"
                          : "mt-0.5 text-primary"
                      }
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block truncate text-sm font-medium">
                        {item.company || item.contactPerson}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.dealTitle
                          ? `Deal: ${item.dealTitle}`
                          : item.contactPerson}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {bucketLabel(item.bucket)} · Next action{" "}
                        {formatDate(item.nextActionDate)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1.5">
          <DropdownMenuItem asChild>
            <Link
              to="/"
              className="cursor-pointer justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold text-primary"
            >
              Open dashboard follow-ups
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
