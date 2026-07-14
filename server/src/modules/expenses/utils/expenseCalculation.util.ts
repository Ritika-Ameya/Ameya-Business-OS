import type { ExpenseEntity, ExpenseMasterEntity } from '../types/expense.entities';

/** Round to 2 decimal places (currency). */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const sumAmounts = (items: { amount: number }[]): number =>
  roundMoney(items.reduce((sum, item) => sum + Number(item.amount || 0), 0));

export interface RegisterStats {
  totalExpense: number;
  paid: number;
  pending: number;
  upcomingRecurring: number;
}

/** Matches frontend `computeRegisterStats`. */
export const computeRegisterStats = (
  transactions: ExpenseEntity[],
  masters: ExpenseMasterEntity[],
): RegisterStats => {
  const totalExpense = sumAmounts(transactions);
  const paid = sumAmounts(transactions.filter((txn) => txn.status === 'paid'));
  const pending = sumAmounts(
    transactions.filter((txn) => txn.status === 'pending' || txn.status === 'partial'),
  );
  const upcomingRecurring = roundMoney(
    masters
      .filter((master) => master.status === 'active' && master.autoGenerate)
      .reduce((sum, master) => sum + Number(master.defaultAmount || 0), 0),
  );

  return { totalExpense, paid, pending, upcomingRecurring };
};

export const categoryTotals = (
  transactions: ExpenseEntity[],
): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const txn of transactions) {
    const key = txn.categoryId || 'unknown';
    totals[key] = roundMoney((totals[key] ?? 0) + Number(txn.amount || 0));
  }
  return totals;
};

export const vendorTotals = (
  transactions: ExpenseEntity[],
): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const txn of transactions) {
    const key = txn.vendorOrEmployee || 'unknown';
    totals[key] = roundMoney((totals[key] ?? 0) + Number(txn.amount || 0));
  }
  return totals;
};
