import { roundMoney } from '../../expenses/utils/expenseCalculation.util';

export interface ForecastReceiptPayment {
  date: string;
  /** Cash that landed in the account. */
  amount: number;
  account: 'gst' | 'other';
  /** Tax deducted by the client. It is not cash. */
  tdsAmount: number;
  /** When true, cash plus TDS both reduce what is still expected. */
  tdsSettles: boolean;
  /** Payment mode slug. Blank on rows recorded before the mode was stored. */
  mode: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const parseReceivedLog = (value: string | undefined): ForecastReceiptPayment[] => {
  if (!value?.trim()) return [];
  const entries: ForecastReceiptPayment[] = [];
  for (const line of value.split('\n')) {
    const [date = '', amount = '', account = '', tds = '', settles = '', mode = ''] = line.split('|');
    if (!DATE.test(date)) continue;
    const cash = roundMoney(Number(amount) || 0);
    if (cash <= 0) continue;
    entries.push({
      date,
      amount: cash,
      account: account === 'other' ? 'other' : 'gst',
      tdsAmount: roundMoney(Math.max(0, Number(tds) || 0)),
      tdsSettles: settles === 'yes',
      mode: mode.trim(),
    });
  }
  return entries;
};

export const formatReceivedLog = (entries: ForecastReceiptPayment[]): string =>
  entries
    .map(
      (entry) =>
        `${entry.date}|${entry.amount}|${entry.account}|${entry.tdsAmount}|${entry.tdsSettles ? 'yes' : 'no'}|${entry.mode || ''}`,
    )
    .join('\n');

/** Cash plus TDS, but only the TDS the user chose to count as settled. */
export const settledByEntry = (entry: ForecastReceiptPayment): number =>
  roundMoney(entry.amount + (entry.tdsSettles ? entry.tdsAmount : 0));

export const settledFromLog = (value: string | undefined): number =>
  roundMoney(parseReceivedLog(value).reduce((sum, entry) => sum + settledByEntry(entry), 0));
