import type { DatePreset } from '../types/analytics.types';
import { endOfDay, parseDatePreset, startOfDay, toLocalDateOnly } from './dateRange.util';
import { monthsBetween } from './chartAggregation.util';

export type DashboardPeriod =
  | 'last-6-months'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'year'
  | 'month'
  | 'custom'
  | 'all';

export interface DashboardPeriodInput {
  period?: DashboardPeriod;
  dateFrom?: string;
  dateTo?: string;
  year?: number;
  /** 1–12 when period is `month`. */
  month?: number;
}

export interface ResolvedDashboardPeriod {
  from: Date | null;
  to: Date | null;
  chartMonths: Date[];
  periodLabel: string;
  period: DashboardPeriod;
}

const formatMonthYear = (date: Date): string =>
  new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);

const formatDay = (date: Date): string =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

export const resolveDashboardPeriod = (
  input: DashboardPeriodInput = {},
): ResolvedDashboardPeriod => {
  const now = new Date();
  const period: DashboardPeriod = input.period ?? 'last-6-months';

  if (period === 'last-6-months') {
    const months = Array.from({ length: 6 }, (_, index) => {
      const offset = 5 - index;
      return new Date(now.getFullYear(), now.getMonth() - offset, 1);
    });
    const from = startOfDay(months[0]);
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return {
      period,
      from,
      to,
      chartMonths: months,
      periodLabel: `${formatMonthYear(from)} – ${formatMonthYear(to)}`,
    };
  }

  if (period === 'year') {
    const year = Number(input.year) || now.getFullYear();
    const from = startOfDay(new Date(year, 0, 1));
    const to = endOfDay(new Date(year, 11, 31));
    return {
      period,
      from,
      to,
      chartMonths: monthsBetween(from, to),
      periodLabel: String(year),
    };
  }

  if (period === 'month') {
    const year = Number(input.year) || now.getFullYear();
    const monthIndex = Math.min(11, Math.max(0, (Number(input.month) || now.getMonth() + 1) - 1));
    const from = startOfDay(new Date(year, monthIndex, 1));
    const to = endOfDay(new Date(year, monthIndex + 1, 0));
    return {
      period,
      from,
      to,
      chartMonths: [from],
      periodLabel: formatMonthYear(from),
    };
  }

  if (period === 'custom') {
    const bounds = parseDatePreset('custom', input.dateFrom, input.dateTo);
    const from = bounds.from ?? startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = bounds.to ?? endOfDay(now);
    const chartFrom = new Date(from.getFullYear(), from.getMonth(), 1);
    const chartTo = new Date(to.getFullYear(), to.getMonth(), 1);
    return {
      period,
      from,
      to,
      chartMonths: monthsBetween(chartFrom, chartTo),
      periodLabel: `${formatDay(from)} – ${formatDay(to)}`,
    };
  }

  if (period === 'all') {
    const months = Array.from({ length: 12 }, (_, index) => {
      const offset = 11 - index;
      return new Date(now.getFullYear(), now.getMonth() - offset, 1);
    });
    return {
      period,
      from: null,
      to: null,
      chartMonths: months,
      periodLabel: 'All time',
    };
  }

  const preset = period as DatePreset;
  const bounds = parseDatePreset(preset);
  const from =
    bounds.from ?? startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = bounds.to ?? endOfDay(now);
  const chartMonths =
    period === 'this-year'
      ? monthsBetween(from, to)
      : monthsBetween(
          new Date(from.getFullYear(), from.getMonth(), 1),
          new Date(to.getFullYear(), to.getMonth(), 1),
        );

  const labels: Record<string, string> = {
    'this-month': formatMonthYear(from),
    'last-month': formatMonthYear(from),
    'this-year': String(from.getFullYear()),
  };

  return {
    period,
    from: bounds.from,
    to: bounds.to,
    chartMonths,
    periodLabel: labels[period] ?? `${toLocalDateOnly(from)} – ${toLocalDateOnly(to)}`,
  };
};
