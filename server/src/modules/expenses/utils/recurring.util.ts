import type { ExpenseEntity, ExpenseMasterEntity } from '../types/expense.entities';
import { roundMoney } from './expenseCalculation.util';

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

const monthsBetween = (start: Date, end: Date): number =>
  (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

export const formatPeriod = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const periodToDate = (period: string, startDate: string): string => {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(startDate);
  const day = start.getDate();
  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, maxDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
};

export const isPeriodDue = (master: ExpenseMasterEntity, period: string): boolean => {
  const [year, month] = period.split('-').map(Number);
  const periodDate = new Date(year, month - 1, 1);
  const start = startOfDay(new Date(master.startDate));

  if (periodDate < new Date(start.getFullYear(), start.getMonth(), 1)) return false;

  if (master.endDate) {
    const end = endOfDay(new Date(master.endDate));
    if (periodDate > end) return false;
  }

  const diff = monthsBetween(start, periodDate);

  switch (master.frequency) {
    case 'monthly':
      return diff >= 0;
    case 'quarterly':
      return diff >= 0 && diff % 3 === 0;
    case 'half-yearly':
      return diff >= 0 && diff % 6 === 0;
    case 'yearly':
      return diff >= 0 && diff % 12 === 0;
    case 'one-time':
      return diff === 0 && period === formatPeriod(start);
    default:
      return false;
  }
};

export const getDuePeriods = (
  master: ExpenseMasterEntity,
  upTo: Date = new Date(),
): string[] => {
  const periods: string[] = [];
  const start = new Date(master.startDate);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(upTo.getFullYear(), upTo.getMonth(), 1);

  while (cursor <= limit) {
    const period = formatPeriod(cursor);
    if (isPeriodDue(master, period)) {
      periods.push(period);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (master.frequency === 'one-time') {
    return periods.slice(0, 1);
  }

  return periods;
};

/** Pending recurring domain fields ready for `repository.create` (no id/audit). */
export type GeneratedExpenseInput = Omit<
  ExpenseEntity,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt' | 'isDeleted' | 'version'
>;

export const generatePendingFromMasters = (
  masters: ExpenseMasterEntity[],
  transactions: ExpenseEntity[],
  upTo: Date = new Date(),
): GeneratedExpenseInput[] => {
  const generated: GeneratedExpenseInput[] = [];

  for (const master of masters) {
    if (master.status !== 'active' || !master.autoGenerate) continue;

    const duePeriods = getDuePeriods(master, upTo);

    for (const period of duePeriods) {
      const exists = transactions.some(
        (txn) => txn.masterTemplateId === master.id && txn.generatedPeriod === period,
      );
      if (exists) continue;

      generated.push({
        expenseDate: periodToDate(period, master.startDate),
        name: master.name,
        categoryId: master.categoryId,
        categoryName: master.categoryName,
        payeeType: master.payeeType,
        vendorOrEmployee: master.vendorOrEmployee,
        vendorId: master.vendorId ?? '',
        employeeId: master.employeeId ?? '',
        amount: roundMoney(master.defaultAmount),
        currency: 'INR',
        status: 'pending',
        paymentMethod: '',
        referenceNumber: '',
        notes: '',
        hasAttachment: false,
        recurring: true,
        masterTemplateId: master.id,
        generatedPeriod: period,
      });
    }
  }

  return generated;
};
