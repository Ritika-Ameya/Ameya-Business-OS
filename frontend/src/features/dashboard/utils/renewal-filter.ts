import type { DashboardRenewalItemDto } from "@/features/dashboard/api/dashboard.dto";

export type RenewalFilter = "overdue" | "this-month" | "next-month" | "next-3" | "all";

export const DEFAULT_RENEWAL_FILTER: RenewalFilter = "next-month";

export const RENEWAL_FILTERS: Array<{ value: RenewalFilter; label: string }> = [
  { value: "overdue", label: "Overdue" },
  { value: "this-month", label: "This month" },
  { value: "next-month", label: "Next month" },
  { value: "next-3", label: "Next 3 months" },
  { value: "all", label: "All" },
];

const pad2 = (value: number) => String(value).padStart(2, "0");

const localIso = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const monthKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

export const todayIso = () => localIso(new Date());

export const matchesRenewalFilter = (
  item: DashboardRenewalItemDto,
  filter: RenewalFilter,
  today = todayIso()
): boolean => {
  const due = item.dueDate.slice(0, 10);
  if (!due) return false;
  const [year, month] = today.split("-").map(Number);
  const thisMonth = monthKey(new Date(year, month - 1, 1));
  const nextMonth = monthKey(new Date(year, month, 1));
  const threeMonthsEnd = localIso(new Date(year, month + 3, 0));
  switch (filter) {
    case "overdue":
      return due < today;
    case "this-month":
      return due >= today && due.slice(0, 7) === thisMonth;
    case "next-month":
      return due.slice(0, 7) === nextMonth;
    case "next-3":
      return due >= today && due <= threeMonthsEnd;
    default:
      return true;
  }
};

export const filterRenewals = (
  items: DashboardRenewalItemDto[],
  filter: RenewalFilter,
  today = todayIso()
): DashboardRenewalItemDto[] =>
  items
    .filter((item) => matchesRenewalFilter(item, filter, today))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.company.localeCompare(b.company));

export const renewalFilterCounts = (
  items: DashboardRenewalItemDto[],
  today = todayIso()
): Record<RenewalFilter, number> => {
  const counts = { overdue: 0, "this-month": 0, "next-month": 0, "next-3": 0, all: 0 } as Record<
    RenewalFilter,
    number
  >;
  for (const filter of RENEWAL_FILTERS) {
    counts[filter.value] = items.filter((item) => matchesRenewalFilter(item, filter.value, today)).length;
  }
  return counts;
};

export const renewalFilterLabel = (filter: RenewalFilter): string =>
  RENEWAL_FILTERS.find((item) => item.value === filter)?.label ?? "All";

const DAY_MS = 24 * 60 * 60 * 1000;

export const renewalTimeLeft = (dueDate: string, today = todayIso()): string => {
  const [dy, dm, dd] = dueDate.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const days = Math.round((new Date(dy, dm - 1, dd).getTime() - new Date(ty, tm - 1, td).getTime()) / DAY_MS);
  if (!Number.isFinite(days)) return "";
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  if (days > 0) return `In ${days} days`;
  return days === -1 ? "1 day overdue" : `${-days} days overdue`;
};

export const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-yearly",
  yearly: "Yearly",
  biennial: "Every 2 years",
  custom: "Custom cycle",
};
