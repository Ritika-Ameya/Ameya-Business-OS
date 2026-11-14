import type { ExpectedReceiptEntity } from '../../canvas/types/canvas.entities';
import { parseReceivedLog } from '../../canvas/utils/receivedLog.util';
import type { CustomerEntity } from '../../customers/types/customer.entities';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import type { ExpenseEntity } from '../../expenses/types/expense.entities';
import type { InvoiceEntity, PaymentEntity } from '../../revenue/types/revenue.entities';
import type { ChartMonthPoint, DashboardExpenseStats } from '../types/analytics.types';
import {
  endOfDay,
  isDateInRange,
  parseDatePreset,
  startOfDay,
  toLocalDateOnly,
} from './dateRange.util';

/** One marked-paid cash line behind Money in / Money out. */
export interface FinanceCashLine {
  id: string;
  date: string;
  amount: number;
  label: string;
  detail: string;
  source: 'invoice_payment' | 'forecast_payment' | 'paid_expense';
}

const monthOf = (value: string | undefined): string => String(value ?? '').trim().slice(0, 7);

const pad2 = (value: number): string => String(value).padStart(2, '0');

const yearMonthOfDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const monthLabel = (date: Date): string =>
  new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date);

/** Inclusive list of calendar months from `from` through `to` (cap 36). */
export const monthsBetween = (from: Date, to: Date): Date[] => {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const months: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end && months.length < 36) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

/** Forecast mark-as-paid cash with no invoice (Business Canvas). */
const forecastCashInRange = (
  receipts: ExpectedReceiptEntity[] | undefined,
  from: Date | null,
  to: Date | null,
  yearMonth?: string,
): number => {
  if (!receipts?.length) return 0;
  let sum = 0;
  for (const receipt of receipts) {
    if (receipt.isDeleted || receipt.invoiceId) continue;
    for (const entry of parseReceivedLog(receipt.receivedLog)) {
      if (yearMonth) {
        if (monthOf(entry.date) !== yearMonth) continue;
      } else if (!isDateInRange(entry.date, from, to)) {
        continue;
      }
      sum += Number(entry.amount || 0);
    }
  }
  return roundMoney(sum);
};

/** Payments with status received, by payment month, on invoices that still exist. */
export const sumReceivedByMonth = (
  payments: PaymentEntity[],
  invoices: InvoiceEntity[],
  yearMonth: string,
  receipts?: ExpectedReceiptEntity[],
): number => {
  const liveInvoiceIds = new Set(invoices.map((invoice) => invoice.id));
  const invoiceCash = roundMoney(
    payments
      .filter(
        (payment) =>
          payment.status === 'received' &&
          liveInvoiceIds.has(payment.invoiceId) &&
          monthOf(payment.paidAt) === yearMonth,
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );
  return roundMoney(invoiceCash + forecastCashInRange(receipts, null, null, yearMonth));
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

/** Paid expenses in a calendar month (money out). */
export const sumPaidExpenseByMonth = (
  expenses: ExpenseEntity[],
  yearMonth: string,
): number =>
  roundMoney(
    expenses
      .filter(
        (expense) =>
          expense.status === 'paid' && monthOf(expense.expenseDate) === yearMonth,
      )
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  );

export const sumReceivedInRange = (
  payments: PaymentEntity[],
  invoices: InvoiceEntity[],
  from: Date | null,
  to: Date | null,
  receipts?: ExpectedReceiptEntity[],
): number => {
  const liveInvoiceIds = new Set(invoices.map((invoice) => invoice.id));
  const invoiceCash = roundMoney(
    payments
      .filter(
        (payment) =>
          payment.status === 'received' &&
          liveInvoiceIds.has(payment.invoiceId) &&
          isDateInRange(payment.paidAt, from, to),
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );
  return roundMoney(invoiceCash + forecastCashInRange(receipts, from, to));
};

export const sumPaidExpenseInRange = (
  expenses: ExpenseEntity[],
  from: Date | null,
  to: Date | null,
): number =>
  roundMoney(
    expenses
      .filter(
        (expense) =>
          expense.status === 'paid' && isDateInRange(expense.expenseDate, from, to),
      )
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  );

export const sumInvoicedInRange = (
  invoices: InvoiceEntity[],
  from: Date | null,
  to: Date | null,
): number =>
  roundMoney(
    invoices
      .filter(
        (invoice) =>
          invoice.status !== 'draft' &&
          invoice.status !== 'cancelled' &&
          isDateInRange(invoice.issueDate, from, to),
      )
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
  );

export interface DashboardFinanceTotals {
  totalRevenue: number;
  totalExpense: number;
  difference: number;
  totalInvoiced: number;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  revenueItems: FinanceCashLine[];
  expenseItems: FinanceCashLine[];
}

const companyLabel = (
  customers: CustomerEntity[] | undefined,
  customerId: string,
  fallback = 'Account',
): string => {
  const customer = customers?.find((item) => item.id === customerId);
  return (
    (customer?.companyName || customer?.contactPerson || fallback).trim() || fallback
  );
};

/** Marked-received invoice payments + forecast cash, newest first. */
export const listReceivedCashInRange = (
  payments: PaymentEntity[],
  invoices: InvoiceEntity[],
  from: Date | null,
  to: Date | null,
  receipts?: ExpectedReceiptEntity[],
  customers?: CustomerEntity[],
): FinanceCashLine[] => {
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const lines: FinanceCashLine[] = [];
  for (const payment of payments) {
    if (payment.status !== 'received') continue;
    if (!isDateInRange(payment.paidAt, from, to)) continue;
    const invoice = invoiceById.get(payment.invoiceId);
    if (!invoice || invoice.status === 'cancelled') continue;
    const paidAt = String(payment.paidAt || '').slice(0, 10);
    lines.push({
      id: payment.id,
      date: paidAt,
      amount: roundMoney(Number(payment.amount) || 0),
      label: companyLabel(customers, payment.customerId || invoice.customerId, invoice.customerName),
      detail: invoice.invoiceNumber
        ? `Invoice ${invoice.invoiceNumber} · marked received`
        : 'Invoice payment · marked received',
      source: 'invoice_payment',
    });
  }
  for (const receipt of receipts ?? []) {
    if (receipt.isDeleted || receipt.invoiceId) continue;
    parseReceivedLog(receipt.receivedLog).forEach((entry, index) => {
      if (!isDateInRange(entry.date, from, to)) return;
      lines.push({
        id: `${receipt.id}:${index}`,
        date: entry.date,
        amount: roundMoney(Number(entry.amount) || 0),
        label: companyLabel(customers, receipt.customerId),
        detail: receipt.reason
          ? `Forecast · marked paid · ${receipt.reason}`
          : 'Forecast · marked paid',
        source: 'forecast_payment',
      });
    });
  }
  return lines.sort(
    (a, b) => b.date.localeCompare(a.date) || b.amount - a.amount || a.id.localeCompare(b.id),
  );
};

/** Expenses with status paid only. */
export const listPaidExpenseInRange = (
  expenses: ExpenseEntity[],
  from: Date | null,
  to: Date | null,
): FinanceCashLine[] =>
  expenses
    .filter(
      (expense) =>
        expense.status === 'paid' && isDateInRange(expense.expenseDate, from, to),
    )
    .map((expense) => ({
      id: expense.id,
      date: String(expense.expenseDate || '').slice(0, 10),
      amount: roundMoney(Number(expense.amount) || 0),
      label: (expense.vendorOrEmployee || expense.categoryName || 'Expense').trim(),
      detail: expense.categoryName
        ? `${expense.categoryName} · marked paid`
        : 'Expense · marked paid',
      source: 'paid_expense' as const,
    }))
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.amount - a.amount || a.id.localeCompare(b.id),
    );

export const buildFinanceTotals = (
  payments: PaymentEntity[],
  invoices: InvoiceEntity[],
  expenses: ExpenseEntity[],
  from: Date | null,
  to: Date | null,
  periodLabel: string,
  receipts?: ExpectedReceiptEntity[],
  customers?: CustomerEntity[],
): DashboardFinanceTotals => {
  const revenueItems = listReceivedCashInRange(
    payments,
    invoices,
    from,
    to,
    receipts,
    customers,
  );
  const expenseItems = listPaidExpenseInRange(expenses, from, to);
  const totalRevenue = roundMoney(
    revenueItems.reduce((sum, item) => sum + item.amount, 0),
  );
  const totalExpense = roundMoney(
    expenseItems.reduce((sum, item) => sum + item.amount, 0),
  );
  return {
    totalRevenue,
    totalExpense,
    difference: roundMoney(totalRevenue - totalExpense),
    totalInvoiced: sumInvoicedInRange(invoices, from, to),
    periodLabel,
    dateFrom: from ? toLocalDateOnly(from) : '',
    dateTo: to ? toLocalDateOnly(to) : '',
    revenueItems,
    expenseItems,
  };
};

const pointForMonth = (
  date: Date,
  invoices: InvoiceEntity[],
  expenses: ExpenseEntity[],
  payments: PaymentEntity[],
  receipts?: ExpectedReceiptEntity[],
): ChartMonthPoint => {
  const from = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
  const to = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  const yearMonth = yearMonthOfDate(date);

  const revenue = roundMoney(
    invoices
      .filter((invoice) => {
        const issueDate = new Date(invoice.issueDate);
        return issueDate >= from && issueDate <= to;
      })
      .reduce((sum, invoice) => sum + Number(invoice.received || 0), 0),
  );

  return {
    month: monthLabel(date),
    yearMonth,
    revenue,
    received: sumReceivedByMonth(payments, invoices, yearMonth, receipts),
    invoiced: sumInvoicedByMonth(invoices, yearMonth),
    expense: sumPaidExpenseByMonth(expenses, yearMonth),
  };
};

/**
 * Month bars for a date window. Money in = received payments; money out = paid expenses.
 * `revenue` keeps the legacy definition (collected on invoices issued in the month).
 */
export const buildRevenueExpenseChartForMonths = (
  invoices: InvoiceEntity[],
  expenses: ExpenseEntity[],
  payments: PaymentEntity[],
  months: Date[],
  receipts?: ExpectedReceiptEntity[],
): ChartMonthPoint[] =>
  months.map((date) => pointForMonth(date, invoices, expenses, payments, receipts));

/**
 * Last 6 months: money received (by payment date), invoiced (by issue date) and
 * paid expense (by expense date).
 */
export const buildRevenueExpenseChart = (
  invoices: InvoiceEntity[],
  expenses: ExpenseEntity[],
  payments: PaymentEntity[] = [],
  receipts?: ExpectedReceiptEntity[],
): ChartMonthPoint[] => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    return new Date(now.getFullYear(), now.getMonth() - offset, 1);
  });
  return buildRevenueExpenseChartForMonths(
    invoices,
    expenses,
    payments,
    months,
    receipts,
  );
};

/** Port of frontend `getDashboardExpenseStats`. */
export const getDashboardExpenseStats = (
  expenses: ExpenseEntity[],
): DashboardExpenseStats => {
  const { from: monthFrom, to: monthTo } = parseDatePreset('this-month');
  const { from: yearFrom, to: yearTo } = parseDatePreset('this-year');

  const monthlyExpense = roundMoney(
    expenses
      .filter(
        (txn) =>
          txn.status === 'paid' && isDateInRange(txn.expenseDate, monthFrom, monthTo),
      )
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
  );

  const pendingExpense = roundMoney(
    expenses
      .filter((txn) => txn.status === 'pending' || txn.status === 'partial')
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
  );

  const yearlyExpense = roundMoney(
    expenses
      .filter(
        (txn) =>
          txn.status === 'paid' && isDateInRange(txn.expenseDate, yearFrom, yearTo),
      )
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0),
  );

  return { monthlyExpense, pendingExpense, yearlyExpense };
};

export { startOfDay, endOfDay };
