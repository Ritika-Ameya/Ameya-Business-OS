import type { InvoiceEntity } from '../../revenue/types/revenue.entities';
import type { UpcomingRevenueRow } from '../types/analytics.types';
import { isInCalendarMonth } from './dateRange.util';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';

/** Invoices expected next calendar month (by due date), excluding drafts and fully paid. */
export const buildUpcomingRevenue = (
  invoices: InvoiceEntity[],
  referenceDate: Date = new Date(),
): { items: UpcomingRevenueRow[]; totalExpectedRevenue: number } => {
  const nextMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  const year = nextMonthDate.getFullYear();
  const month = nextMonthDate.getMonth();

  const items = invoices
    .filter((invoice) => {
      if (invoice.isDeleted) return false;
      if (invoice.status === 'draft' || invoice.status === 'cancelled') return false;
      if (invoice.status === 'paid') return false;
      if (!isInCalendarMonth(invoice.dueDate, year, month)) return false;
      return Number(invoice.outstanding || 0) > 0 || Number(invoice.total || 0) > 0;
    })
    .map((invoice) => {
      const outstanding = Number(invoice.outstanding || 0);
      const amount = outstanding > 0 ? outstanding : Number(invoice.total || 0);
      return {
        id: invoice.id,
        customer: invoice.customerName || '—',
        invoiceNumber: invoice.invoiceNumber || '—',
        dueDate: invoice.dueDate,
        amount: roundMoney(amount),
        status: invoice.status,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const totalExpectedRevenue = roundMoney(
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  );

  return { items, totalExpectedRevenue };
};
