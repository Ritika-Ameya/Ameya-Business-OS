import type { DatePreset, DateRangeBounds } from '../types/analytics.types';

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

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** Local calendar YYYY-MM-DD (avoids UTC off-by-one from toISOString). */
export const toLocalDateOnly = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** Add calendar days in local time, return YYYY-MM-DD. */
export const addLocalDays = (days: number, from: Date = new Date()): string => {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + days);
  return toLocalDateOnly(date);
};

/** Subtract calendar days from a YYYY-MM-DD string using local math. */
export const subtractLocalDaysFromIso = (isoDate: string, days: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() - days);
  return toLocalDateOnly(date);
};

/** Port of frontend `getDateRangeForPreset` (expense-utils). */
export const parseDatePreset = (
  preset: DatePreset,
  customFrom?: string,
  customTo?: string,
): DateRangeBounds => {
  const now = new Date();

  if (preset === 'all') return { from: null, to: null };

  if (preset === 'custom') {
    return {
      from: customFrom ? startOfDay(new Date(customFrom)) : null,
      to: customTo ? endOfDay(new Date(customTo)) : null,
    };
  }

  if (preset === 'today') {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (preset === 'this-week') {
    const from = new Date(now);
    from.setDate(now.getDate() - now.getDay());
    return { from: startOfDay(from), to: endOfDay(now) };
  }

  if (preset === 'this-month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  if (preset === 'last-month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  if (preset === 'this-quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    const from = new Date(now.getFullYear(), quarter * 3, 1);
    const to = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  // this-year
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear(), 11, 31);
  return { from: startOfDay(from), to: endOfDay(to) };
};

export const isDateInRange = (
  dateStr: string,
  from: Date | null,
  to: Date | null,
): boolean => {
  if (!dateStr) return !from && !to;
  const date = new Date(dateStr);
  return (!from || date >= from) && (!to || date <= to);
};

export const isInCalendarMonth = (dateStr: string, year: number, month: number): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date.getMonth() === month && date.getFullYear() === year;
};

export { startOfDay, endOfDay };
