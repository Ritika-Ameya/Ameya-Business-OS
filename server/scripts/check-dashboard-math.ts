import { writeFileSync } from 'fs';
import {
  buildFinanceTotals,
  buildRevenueExpenseChartForMonths,
  monthsBetween,
  sumReceivedByMonth,
  sumPaidExpenseByMonth,
  sumInvoicedByMonth,
  startOfDay,
  endOfDay,
} from '../src/modules/analytics/utils/chartAggregation.util';
import { resolveDashboardPeriod } from '../src/modules/analytics/utils/dashboardPeriod.util';

const invoices = [
  { id: 'i1', status: 'paid', issueDate: '2026-10-01', total: 11800, received: 11800 },
  { id: 'i2', status: 'partially_paid', issueDate: '2026-10-15', total: 5900, received: 2000 },
  { id: 'i3', status: 'draft', issueDate: '2026-10-20', total: 9999, received: 0 },
  { id: 'i4', status: 'cancelled', issueDate: '2026-11-01', total: 5000, received: 0 },
  { id: 'i5', status: 'due', issueDate: '2026-11-10', total: 2360, received: 0 },
] as any;

const payments = [
  { id: 'p1', invoiceId: 'i1', status: 'received', paidAt: '2026-10-05', amount: 11800 },
  { id: 'p2', invoiceId: 'i2', status: 'received', paidAt: '2026-10-18', amount: 2000 },
  { id: 'p3', invoiceId: 'i2', status: 'pending', paidAt: '2026-10-19', amount: 3900 },
  { id: 'p4', invoiceId: 'i5', status: 'received', paidAt: '2026-11-12', amount: 1000 },
  { id: 'p5', invoiceId: 'missing', status: 'received', paidAt: '2026-10-01', amount: 777 },
] as any;

const expenses = [
  { id: 'e1', status: 'paid', expenseDate: '2026-10-08', amount: 1500 },
  { id: 'e2', status: 'paid', expenseDate: '2026-10-22', amount: 500 },
  { id: 'e3', status: 'pending', expenseDate: '2026-10-25', amount: 800 },
  { id: 'e4', status: 'partial', expenseDate: '2026-10-26', amount: 200 },
  { id: 'e5', status: 'paid', expenseDate: '2026-11-05', amount: 300 },
  { id: 'e6', status: 'cancelled', expenseDate: '2026-11-06', amount: 1000 },
] as any;

const octFrom = startOfDay(new Date(2026, 9, 1));
const octTo = endOfDay(new Date(2026, 9, 31));
const novFrom = startOfDay(new Date(2026, 10, 1));
const novTo = endOfDay(new Date(2026, 10, 30));

const octFinance = buildFinanceTotals(payments, invoices, expenses, octFrom, octTo, 'Oct');
const novFinance = buildFinanceTotals(payments, invoices, expenses, novFrom, novTo, 'Nov');
const rangeFinance = buildFinanceTotals(payments, invoices, expenses, octFrom, novTo, 'Oct-Nov');
const allFinance = buildFinanceTotals(payments, invoices, expenses, null, null, 'All');

const points = buildRevenueExpenseChartForMonths(
  invoices,
  expenses,
  payments,
  monthsBetween(octFrom, novTo),
);

type Check = [string, unknown, unknown];

const checks: Check[] = [
  ['oct.revenue', octFinance.totalRevenue, 13800],
  ['oct.expense', octFinance.totalExpense, 2000],
  ['oct.diff', octFinance.difference, 11800],
  ['oct.invoiced', octFinance.totalInvoiced, 17700],
  ['nov.revenue', novFinance.totalRevenue, 1000],
  ['nov.expense', novFinance.totalExpense, 300],
  ['nov.diff', novFinance.difference, 700],
  ['nov.invoiced', novFinance.totalInvoiced, 2360],
  ['range.revenue', rangeFinance.totalRevenue, 14800],
  ['range.expense', rangeFinance.totalExpense, 2300],
  ['range.diff', rangeFinance.difference, 12500],
  ['range.invoiced', rangeFinance.totalInvoiced, 20060],
  ['all.revenue', allFinance.totalRevenue, 14800],
  ['all.expense', allFinance.totalExpense, 2300],
  ['all.diff', allFinance.difference, 12500],
  ['monthOct.received', sumReceivedByMonth(payments, invoices, '2026-10'), 13800],
  ['monthOct.expense', sumPaidExpenseByMonth(expenses, '2026-10'), 2000],
  ['monthOct.invoiced', sumInvoicedByMonth(invoices, '2026-10'), 17700],
  ['monthNov.received', sumReceivedByMonth(payments, invoices, '2026-11'), 1000],
  ['monthNov.expense', sumPaidExpenseByMonth(expenses, '2026-11'), 300],
  ['point.oct.in', points[0]?.received, 13800],
  ['point.oct.out', points[0]?.expense, 2000],
  ['point.oct.net', (points[0]?.received ?? 0) - (points[0]?.expense ?? 0), 11800],
  ['point.nov.in', points[1]?.received, 1000],
  ['point.nov.out', points[1]?.expense, 300],
  ['point.nov.net', (points[1]?.received ?? 0) - (points[1]?.expense ?? 0), 700],
  [
    'points.sum matches range.diff',
    points.reduce((sum, point) => sum + point.received - point.expense, 0),
    rangeFinance.difference,
  ],
  ['year.months', resolveDashboardPeriod({ period: 'year', year: 2026 }).chartMonths.length, 12],
  [
    'month.one',
    resolveDashboardPeriod({ period: 'month', year: 2026, month: 10 }).chartMonths.length,
    1,
  ],
  ['last6.months', resolveDashboardPeriod({ period: 'last-6-months' }).chartMonths.length, 6],
];

const failures = checks
  .filter(([, actual, expected]) => actual !== expected)
  .map(([name, actual, expected]) => ({ name, actual, expected }));

const result = {
  passed: failures.length === 0,
  totalChecks: checks.length,
  failures,
  sample: { octFinance, novFinance, rangeFinance, points },
};

writeFileSync('tmp-math-check.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
