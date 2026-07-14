import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import type { ExpenseEntity } from '../../expenses/types/expense.entities';
import type { InvoiceEntity } from '../../revenue/types/revenue.entities';
import type { ChartMonthPoint, DashboardExpenseStats } from '../types/analytics.types';
import { endOfDay, isDateInRange, parseDatePreset, startOfDay } from './dateRange.util';

/** Last 6 months revenue (sum invoice.received by issueDate) vs expense (sum amount by expenseDate). */
export const buildRevenueExpenseChart = (
  invoices: InvoiceEntity[],
  expenses: ExpenseEntity[],
): ChartMonthPoint[] => {
  const now = new Date();
  const points: ChartMonthPoint[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const from = startOfDay(date);
    const to = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    const month = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const revenue = roundMoney(
      invoices
        .filter((invoice) => {
          const issueDate = new Date(invoice.issueDate);
          return issueDate >= from && issueDate <= to;
        })
        .reduce((sum, invoice) => sum + Number(invoice.received || 0), 0),
    );

    const expense = roundMoney(
      expenses
        .filter((txn) => {
          const expenseDate = new Date(txn.expenseDate);
          return expenseDate >= from && expenseDate <= to;
        })
        .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
    );

    points.push({ month, yearMonth, revenue, expense });
  }

  return points;
};

/** Port of frontend `getDashboardExpenseStats`. */
export const getDashboardExpenseStats = (
  expenses: ExpenseEntity[],
): DashboardExpenseStats => {
  const { from: monthFrom, to: monthTo } = parseDatePreset('this-month');
  const { from: yearFrom, to: yearTo } = parseDatePreset('this-year');

  const monthlyExpense = roundMoney(
    expenses
      .filter((txn) => isDateInRange(txn.expenseDate, monthFrom, monthTo))
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
  );

  const pendingExpense = roundMoney(
    expenses
      .filter((txn) => txn.status === 'pending' || txn.status === 'partial')
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
  );

  const yearlyExpense = roundMoney(
    expenses
      .filter((txn) => isDateInRange(txn.expenseDate, yearFrom, yearTo))
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
  );

  return { monthlyExpense, pendingExpense, yearlyExpense };
};
