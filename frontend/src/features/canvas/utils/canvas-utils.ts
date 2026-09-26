import type {
  CanvasCard,
  CanvasFilters,
  CanvasRowKey,
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

export const presetMonthKeys = (
  preset: RangePreset,
  todayIso: string,
  customFrom: string,
  customTo: string
): string[] => {
  const today = parseToday(todayIso);
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
  status: CanvasFilters["status"]
): string[] => {
  if (status === "overdue") return receiptMonths(cards, "overdue");
  if (preset === "all") {
    const scheduled = receiptMonths(cards);
    const hasUnscheduled = cards.some(
      (card) => card.kind === "receipt" && card.monthKey === "unscheduled"
    );
    return hasUnscheduled ? ["unscheduled", ...scheduled] : scheduled;
  }
  return presetMonthKeys(preset, todayIso, customFrom, customTo);
};

export const cardsInMonths = (cards: CanvasCard[], months: string[]): CanvasCard[] =>
  cards.filter((card) => card.kind === "receipt" && months.includes(card.monthKey));

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
