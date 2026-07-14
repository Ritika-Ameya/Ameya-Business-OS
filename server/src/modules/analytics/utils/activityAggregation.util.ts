import type { DealEntity } from '../../deals/types/deal.entities';
import type { ExpenseEntity } from '../../expenses/types/expense.entities';
import type { InvoiceEntity, PaymentEntity } from '../../revenue/types/revenue.entities';
import type { ActivityItem } from '../types/analytics.types';

/** Build recent activity from live entities (max `limit`). */
export const buildRecentActivity = (
  invoices: InvoiceEntity[],
  payments: PaymentEntity[],
  deals: DealEntity[],
  expenses: ExpenseEntity[],
  limit = 20,
): ActivityItem[] => {
  const items: ActivityItem[] = [];

  for (const invoice of invoices) {
    items.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice_generated',
      title: 'Invoice Generated',
      description: `${invoice.invoiceNumber} · ${invoice.customerName}`.trim(),
      timestamp: invoice.createdAt,
    });
  }

  for (const payment of payments) {
    if (payment.status !== 'received') continue;
    items.push({
      id: `payment-${payment.id}`,
      type: 'payment_recorded',
      title: 'Payment Recorded',
      description: `${payment.amount} received${payment.reference ? ` · ${payment.reference}` : ''}`.trim(),
      timestamp: payment.paidAt || payment.createdAt,
    });
  }

  for (const deal of deals) {
    items.push({
      id: `deal-${deal.id}`,
      type: 'deal_created',
      title: 'Deal Created',
      description: `${deal.title} · ${deal.customerName}`.trim(),
      timestamp: deal.createdAt,
    });
  }

  for (const expense of expenses) {
    items.push({
      id: `expense-${expense.id}`,
      type: 'expense_added',
      title: 'Expense Added',
      description: `${expense.name} · ${expense.vendorOrEmployee}`.trim(),
      timestamp: expense.createdAt,
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};
