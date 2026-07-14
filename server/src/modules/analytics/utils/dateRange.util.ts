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
