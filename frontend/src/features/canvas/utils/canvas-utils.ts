import type {
  CanvasCard,
  CanvasFilters,
  CanvasPaidEntry,
  CanvasRenewalReminder,
  CanvasRowKey,
  PeriodPick,
  RangePreset,
} from "@/features/canvas/types/canvas";

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const monthKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

export const addMonths = (date: Date, count: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

export const parseToday = (today: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(today);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const formatMonthLabel = (monthKey: string): string => {
  if (monthKey === "unscheduled") return "Unscheduled";
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return monthKey;
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(Number(match[1]), Number(match[2]) - 1, 1)
  );
};

export const quarterLabel = (year: number, quarterIndex: number): string =>
  `Q${quarterIndex + 1} ${year}`;

const monthsBetween = (fromKey: string, toKey: string): string[] => {
  const fromMatch = /^(\d{4})-(\d{2})$/.exec(fromKey);
  const toMatch = /^(\d{4})-(\d{2})$/.exec(toKey);
  if (!fromMatch || !toMatch) return [];
  const cursor = new Date(Number(fromMatch[1]), Number(fromMatch[2]) - 1, 1);
  const end = new Date(Number(toMatch[1]), Number(toMatch[2]) - 1, 1);
  const keys: string[] = [];
  while (cursor <= end && keys.length < 18) {
    keys.push(monthKeyOf(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

export const periodPickFor = (todayIso: string): PeriodPick => {
  const today = parseToday(todayIso);
  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    quarter: Math.floor(today.getMonth() / 3),
  };
};

export const presetMonthKeys = (
  preset: RangePreset,
  todayIso: string,
  customFrom: string,
  customTo: string,
  pick?: PeriodPick
): string[] => {
  const today = parseToday(todayIso);
  if (preset === "month" && pick) return [monthKeyOf(new Date(pick.year, pick.month, 1))];
  if (preset === "quarter" && pick) {
    const start = new Date(pick.year, pick.quarter * 3, 1);
    return [0, 1, 2].map((offset) => monthKeyOf(addMonths(start, offset)));
  }
  if (preset === "this-month") return [monthKeyOf(today)];
  if (preset === "last-month") return [monthKeyOf(addMonths(today, -1))];
  if (preset === "next-month") return [monthKeyOf(addMonths(today, 1))];
  if (preset === "month-after") return [monthKeyOf(addMonths(today, 2))];
  if (preset === "this-quarter") {
    const start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    return [0, 1, 2].map((offset) => monthKeyOf(addMonths(start, offset)));
  }
  if (preset === "next-quarter") {
    const start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 1);
    return [0, 1, 2].map((offset) => monthKeyOf(addMonths(start, offset)));
  }
  if (preset === "custom") return monthsBetween(customFrom, customTo);
  return [0, 1, 2].map((offset) => monthKeyOf(addMonths(today, offset)));
};

const countsAsCash = (card: CanvasCard): boolean =>
  card.kind === "receipt" && (card.status === "expected" || card.status === "overdue");

const MONTH_KEY = /^\d{4}-\d{2}$/;

export const filterCanvasCards = (cards: CanvasCard[], filters: CanvasFilters): CanvasCard[] => {
  const query = filters.q.trim().toLowerCase();
  const min = filters.amountMin.trim() === "" ? null : Number(filters.amountMin);
  const max = filters.amountMax.trim() === "" ? null : Number(filters.amountMax);

  return cards.filter((card) => {
    if (filters.recordType !== "all" && card.recordType !== filters.recordType) return false;
    if (filters.temperature === "hot" || filters.temperature === "warm" || filters.temperature === "cold") {
      if (card.recordType !== "opportunity" || card.temperature !== filters.temperature) return false;
    }
    if (filters.temperature === "unclassified") {
      if (card.recordType !== "opportunity" || card.temperature) return false;
    }
    if (filters.source !== "all" && card.sourceType !== filters.source) return false;
    if (filters.status !== "all" && card.status !== filters.status) return false;
    if (filters.dealId && card.dealId !== filters.dealId) return false;
    if (min !== null || max !== null) {
      if (card.expectedAmount === null) return false;
      if (min !== null && card.expectedAmount < min) return false;
      if (max !== null && card.expectedAmount > max) return false;
    }
    if (!query) return true;
    const haystack = [
      card.companyName,
      card.dealTitle,
      card.invoiceNumber,
      card.reason,
      card.sourceType,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
};

const receiptMonths = (cards: CanvasCard[], status?: CanvasCard["status"]): string[] => {
  const keys = cards
    .filter(
      (card) =>
        card.kind === "receipt" &&
        card.monthKey !== "unscheduled" &&
        (status ? card.status === status : true)
    )
    .map((card) => card.monthKey);
  return [...new Set(keys)].sort();
};

export const visibleMonthKeys = (
  preset: RangePreset,
  todayIso: string,
  customFrom: string,
  customTo: string,
  cards: CanvasCard[],
  status: CanvasFilters["status"],
  pick?: PeriodPick
): string[] => {
  if (status === "overdue") return receiptMonths(cards, "overdue");
  if (preset === "all") {
    const currentMonth = monthKeyOf(parseToday(todayIso));
    const scheduled = receiptMonths(cards);
    if (cards.some((card) => isCarryForward(card, currentMonth)) && !scheduled.includes(currentMonth)) {
      scheduled.push(currentMonth);
      scheduled.sort();
    }
    const hasUnscheduled = cards.some(
      (card) => card.kind === "receipt" && card.monthKey === "unscheduled"
    );
    return hasUnscheduled ? ["unscheduled", ...scheduled] : scheduled;
  }
  return presetMonthKeys(preset, todayIso, customFrom, customTo, pick);
};

/** Still unpaid and expected in a month before `monthKey`. */
export const isCarryForward = (card: CanvasCard, monthKey: string): boolean =>
  countsAsCash(card) && MONTH_KEY.test(card.monthKey) && card.monthKey < monthKey;

/**
 * An unpaid receipt stays outstanding in every month after its own until it is
 * paid. The card is never copied: on a board showing several months it sits in
 * exactly one column, so month and quarter totals count it once.
 *
 * - Its own month is on screen and it is not yet past due by month: stays there.
 * - Past due by month: shown in the latest visible month up to the current
 *   month, i.e. where it is outstanding now.
 * - The view starts after its month (for example a future quarter): shown in
 *   the first visible month.
 */
export const placeCarriedForward = (
  cards: CanvasCard[],
  months: string[],
  todayIso: string
): CanvasCard[] => {
  const scheduled = months.filter((month) => MONTH_KEY.test(month)).sort();
  if (scheduled.length === 0) return cards;
  const currentMonth = monthKeyOf(parseToday(todayIso));
  const first = scheduled[0];

  const targetFor = (card: CanvasCard): string | null => {
    if (!countsAsCash(card) || !MONTH_KEY.test(card.monthKey)) return null;
    const own = card.monthKey;
    if (own < currentMonth) {
      const upToNow = scheduled.filter((month) => month >= own && month <= currentMonth);
      if (upToNow.length > 0) return upToNow[upToNow.length - 1];
    }
    if (scheduled.includes(own)) return own;
    return own < first ? first : null;
  };

  return cards.map((card) => {
    const target = targetFor(card);
    if (!target || target === card.monthKey) return card;
    return { ...card, monthKey: target, carriedFrom: card.monthKey };
  });
};

export const cardsInMonths = (cards: CanvasCard[], months: string[]): CanvasCard[] =>
  cards.filter((card) => card.kind === "receipt" && months.includes(card.monthKey));

export interface CanvasTotal {
  count: number;
  amount: number;
  exGst: number;
}

export interface CanvasViewSummary {
  expected: CanvasTotal;
  carried: CanvasTotal;
  paid: { count: number; amount: number };
  items: {
    expected: CanvasCard[];
    carried: CanvasCard[];
    paid: CanvasPaidEntry[];
  };
  byMonth: Array<{ monthKey: string; expected: number; carried: number; paid: number }>;
}

/** The month a card belongs to, before any carry-forward placement. */
export const ownMonthOf = (card: CanvasCard): string => card.carriedFrom ?? card.monthKey;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Period totals, each unpaid receipt counted once:
 * - `expected`: unpaid receipts whose own month is inside the period.
 * - `carried`: unpaid receipts from before the period, still outstanding.
 * - `paid`: money actually received in the period.
 *
 * `byMonth` is a per-month outstanding position: `expected` is that month's own
 * dues and `carried` is everything still unpaid from earlier months, so the same
 * receipt appears in every later month's `carried` until it is paid. These are
 * balances, not additive amounts; use the top-level totals for the period sum.
 */
export const summarizeView = (
  visible: CanvasCard[],
  months: string[],
  paid: CanvasPaidEntry[],
  query: string,
  source: CanvasCard[] = visible
): CanvasViewSummary => {
  const scheduled = months.filter((monthKey) => MONTH_KEY.test(monthKey)).sort();
  const firstMonth = scheduled[0] ?? "";
  const byMonth = new Map(
    scheduled.map((monthKey) => [monthKey, { monthKey, expected: 0, carried: 0, paid: 0 }])
  );
  const summary: CanvasViewSummary = {
    expected: { count: 0, amount: 0, exGst: 0 },
    carried: { count: 0, amount: 0, exGst: 0 },
    paid: { count: 0, amount: 0 },
    items: { expected: [], carried: [], paid: [] },
    byMonth: [],
  };

  for (const card of visible) {
    if (!countsAsCash(card)) continue;
    const ownMonth = ownMonthOf(card);
    const carried = Boolean(firstMonth) && MONTH_KEY.test(ownMonth) && ownMonth < firstMonth;
    const bucket = carried ? summary.carried : summary.expected;
    bucket.count += 1;
    bucket.amount += card.expectedAmount ?? 0;
    bucket.exGst += card.amountExGst ?? card.expectedAmount ?? 0;
    (carried ? summary.items.carried : summary.items.expected).push(card);
  }

  for (const card of source) {
    if (!countsAsCash(card)) continue;
    const ownMonth = ownMonthOf(card);
    if (!MONTH_KEY.test(ownMonth)) continue;
    const amount = card.expectedAmount ?? 0;
    for (const month of byMonth.values()) {
      if (ownMonth === month.monthKey) month.expected += amount;
      else if (ownMonth < month.monthKey) month.carried += amount;
    }
  }

  const needle = query.trim().toLowerCase();
  for (const entry of paid) {
    const month = byMonth.get(entry.paidAt.slice(0, 7));
    if (!month) continue;
    if (needle && !`${entry.companyName} ${entry.invoiceNumber}`.toLowerCase().includes(needle)) {
      continue;
    }
    summary.paid.count += 1;
    summary.paid.amount += entry.amount;
    month.paid += entry.amount;
    summary.items.paid.push(entry);
  }

  const byDate = (a: CanvasCard, b: CanvasCard) =>
    a.expectedDate.localeCompare(b.expectedDate) || a.companyName.localeCompare(b.companyName);
  summary.items.expected.sort(byDate);
  summary.items.carried.sort(byDate);
  summary.items.paid.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  for (const total of [summary.expected, summary.carried]) {
    total.amount = round2(total.amount);
    total.exGst = round2(total.exGst);
  }
  summary.paid.amount = round2(summary.paid.amount);
  summary.byMonth = [...byMonth.values()].map((month) => ({
    ...month,
    expected: round2(month.expected),
    carried: round2(month.carried),
    paid: round2(month.paid),
  }));
  return summary;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysUntil = (isoDate: string, todayIso: string): number =>
  Math.round((parseToday(isoDate).getTime() - parseToday(todayIso).getTime()) / DAY_MS);

/** "In 5 days", "Due today", "3 days overdue". */
export const timeRemainingLabel = (isoDate: string, todayIso: string): string => {
  const days = daysUntil(isoDate, todayIso);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 0) return `In ${days} days`;
  return days === -1 ? "1 day overdue" : `${-days} days overdue`;
};

/** Overdue or due within about a month: the renewals to act on now. */
export const RENEWAL_REMINDER_DAYS = 31;

export const isRenewalDueSoon = (renewal: CanvasRenewalReminder, todayIso: string): boolean =>
  daysUntil(renewal.renewalDate, todayIso) <= RENEWAL_REMINDER_DAYS;

/**
 * Renewals that belong to the months on screen, using the board's own rule: a
 * renewal shows in its month, and while unpaid it stays in every later month.
 */
export const renewalsInView = (
  renewals: CanvasRenewalReminder[],
  months: string[],
  overdueOnly: boolean,
  query: string
): CanvasRenewalReminder[] => {
  const scheduled = months.filter((month) => MONTH_KEY.test(month)).sort();
  const lastMonth = scheduled[scheduled.length - 1];
  const needle = query.trim().toLowerCase();
  return renewals.filter((item) => {
    if (overdueOnly ? item.status !== "overdue" : !lastMonth || item.renewalDate.slice(0, 7) > lastMonth) {
      return false;
    }
    if (!needle) return true;
    return `${item.companyName} ${item.componentName} ${item.dealTitle} ${item.invoiceNumber}`
      .toLowerCase()
      .includes(needle);
  });
};

export const sumMonth = (cards: CanvasCard[], monthKey: string): number =>
  cards.reduce((sum, card) => {
    if (!countsAsCash(card) || card.monthKey !== monthKey) return sum;
    return sum + (card.expectedAmount ?? 0);
  }, 0);

export const sumQuarter = (cards: CanvasCard[], year: number, quarterIndex: number): number =>
  cards.reduce((sum, card) => {
    if (!countsAsCash(card)) return sum;
    const match = /^(\d{4})-(\d{2})$/.exec(card.monthKey);
    if (!match) return sum;
    const cardYear = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (cardYear !== year || Math.floor(monthIndex / 3) !== quarterIndex) return sum;
    return sum + (card.expectedAmount ?? 0);
  }, 0);

export const overdueStats = (cards: CanvasCard[]): { count: number; amount: number } => {
  const overdue = cards.filter((card) => card.kind === "receipt" && card.status === "overdue");
  return {
    count: overdue.length,
    amount: overdue.reduce((sum, card) => sum + (card.expectedAmount ?? 0), 0),
  };
};

export const cardsInCell = (
  cards: CanvasCard[],
  rowKey: CanvasRowKey,
  monthKey: string
): CanvasCard[] =>
  cards
    .filter((card) => card.rowKey === rowKey && card.monthKey === monthKey)
    .sort((a, b) => a.companyName.localeCompare(b.companyName) || a.expectedDate.localeCompare(b.expectedDate));

export const dateInMonth = (monthKey: string, day = 15): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return "";
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return `${monthKey}-${pad2(Math.min(day, lastDay))}`;
};
