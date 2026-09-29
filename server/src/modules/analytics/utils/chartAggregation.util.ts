import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import type { ExpenseEntity } from '../../expenses/types/expense.entities';
import type { InvoiceEntity, PaymentEntity } from '../../revenue/types/revenue.entities';
import type { ChartMonthPoint, DashboardExpenseStats } from '../types/analytics.types';
import { endOfDay, isDateInRange, parseDatePreset, startOfDay } from './dateRange.util';

const monthOf = (value: string | undefined): string => String(value ?? '').trim().slice(0, 7);

/** Payments with status received, by payment month, on invoices that still exist. */
export const sumReceivedByMonth = (
  payments: PaymentEntity[],
  invoices: InvoiceEntity[],
  yearMonth: string,
): number => {
  const liveInvoiceIds = new Set(invoices.map((invoice) => invoice.id));
  return roundMoney(
    payments
      .filter(
        (payment) =>
          payment.status === 'received' &&
          liveInvoiceIds.has(payment.invoiceId) &&
          monthOf(payment.paidAt) === yearMonth,
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );
};

/** Invoice totals (with GST) raised in the month, drafts and cancelled left out. */
export const sumInvoicedByMonth = (invoices: InvoiceEntity[], yearMonth: string): number =>
  roundMoney(
    invoices
      .filter(
        (invoice) =>
          invoice.status !== 'draft' &&
          invoice.status !== 'cancelled' &&
          monthOf(invoice.issueDate) === yearMonth,
      )
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
  );

/**
 * Last 6 months: money received (by payment date), invoiced (by issue date) and
 * expense (by expense date). `revenue` keeps the legacy definition (collected on
 * invoices issued in the month) for existing API consumers.
 */
export const buildRevenueExpenseChart = (
  invoices: InvoiceEntity[],
  expenses: ExpenseEntity[],
  payments: PaymentEntity[] = [],
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

    points.push({
      month,
      yearMonth,
      revenue,
      received: sumReceivedByMonth(payments, invoices, yearMonth),
      invoiced: sumInvoicedByMonth(invoices, yearMonth),
      expense,
    });
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
