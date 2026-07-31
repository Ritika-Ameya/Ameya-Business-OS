import type { RenewalDatePreset, RenewalFilters } from "@/features/revenue/types/revenue";

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

export const renewalDatePresetLabels: Record<RenewalDatePreset, string> = {
  all: "All Dates",
  "this-month": "This Month",
  "next-month": "Next Month",
  "last-month": "Last Month",
  quarter: "Quarter",
  "next-quarter": "Next Quarter",
  "current-year": "Current Year",
  custom: "Custom Date",
  "month-wise": "Month-wise",
  "quarter-wise": "Quarter-wise",
};

export function getCurrentQuarterIndex(date: Date = new Date()): number {
  return Math.floor(date.getMonth() / 3);
}

export function getMonthBounds(year: number, monthIndex: number): { from: Date; to: Date } {
  return {
    from: startOfDay(new Date(year, monthIndex, 1)),
    to: endOfDay(new Date(year, monthIndex + 1, 0)),
  };
}

export function getQuarterBounds(year: number, quarterIndex: number): { from: Date; to: Date } {
  const startMonth = quarterIndex * 3;
  return {
    from: startOfDay(new Date(year, startMonth, 1)),
    to: endOfDay(new Date(year, startMonth + 3, 0)),
  };
}

/** Build selectable quarters for the quarter-wise filter (prior year → next year). */
export function buildQuarterOptions(reference: Date = new Date()): string[] {
  const year = reference.getFullYear();
  const options: string[] = [];
  for (const y of [year - 1, year, year + 1]) {
    for (let q = 1; q <= 4; q++) {
      options.push(`${y}-Q${q}`);
    }
  }
  return options;
}

export function parseQuarterKey(key: string): { year: number; quarterIndex: number } | null {
  const match = /^(\d{4})-Q([1-4])$/.exec(key.trim());
  if (!match) return null;
  return { year: Number(match[1]), quarterIndex: Number(match[2]) - 1 };
}

export function getRenewalDateRange(
  filters: Pick<
    RenewalFilters,
    "date" | "customFrom" | "customTo" | "selectedMonth" | "selectedQuarter"
  >,
  reference: Date = new Date()
): { from: Date | null; to: Date | null } {
  const now = reference;
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = getCurrentQuarterIndex(now);

  switch (filters.date) {
    case "all":
      return { from: null, to: null };
    case "this-month":
      return getMonthBounds(year, month);
    case "next-month": {
      const next = new Date(year, month + 1, 1);
      return getMonthBounds(next.getFullYear(), next.getMonth());
    }
    case "last-month": {
      const prev = new Date(year, month - 1, 1);
      return getMonthBounds(prev.getFullYear(), prev.getMonth());
    }
    case "quarter":
      return getQuarterBounds(year, quarter);
    case "next-quarter": {
      const nextQuarterStart = new Date(year, quarter * 3 + 3, 1);
      return getQuarterBounds(
        nextQuarterStart.getFullYear(),
        getCurrentQuarterIndex(nextQuarterStart)
      );
    }
    case "current-year":
      return {
        from: startOfDay(new Date(year, 0, 1)),
        to: endOfDay(new Date(year, 11, 31)),
      };
    case "custom":
      return {
        from: filters.customFrom ? startOfDay(new Date(filters.customFrom)) : null,
        to: filters.customTo ? endOfDay(new Date(filters.customTo)) : null,
      };
    case "month-wise": {
      if (!filters.selectedMonth) return { from: null, to: null };
      const [y, m] = filters.selectedMonth.split("-").map(Number);
      if (!y || !m) return { from: null, to: null };
      return getMonthBounds(y, m - 1);
    }
    case "quarter-wise": {
      const parsed = parseQuarterKey(filters.selectedQuarter);
      if (!parsed) return { from: null, to: null };
      return getQuarterBounds(parsed.year, parsed.quarterIndex);
    }
    default:
      return { from: null, to: null };
  }
}

export function isDateInRenewalRange(
  dateStr: string,
  from: Date | null,
  to: Date | null
): boolean {
  if (!dateStr) return !from && !to;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  return (!from || date >= from) && (!to || date <= to);
}

export function isRenewalInMonth(dateStr: string, year: number, monthIndex: number): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date.getFullYear() === year && date.getMonth() === monthIndex;
}

export function isRenewalInQuarter(
  dateStr: string,
  year: number,
  quarterIndex: number
): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return (
    date.getFullYear() === year && Math.floor(date.getMonth() / 3) === quarterIndex
  );
}
