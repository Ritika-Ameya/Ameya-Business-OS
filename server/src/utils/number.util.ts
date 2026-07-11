import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '../constants';

export const round = (value: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const isNumeric = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

export const parseNumber = (value: string | number, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const formatCurrency = (
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};

export const percentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return round((value / total) * 100);
};
