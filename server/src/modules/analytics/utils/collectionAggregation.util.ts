import type { InvoiceEntity } from '../../revenue/types/revenue.entities';

/** Port of frontend `getCollectionInvoices`. */
export const getCollectionInvoices = (invoices: InvoiceEntity[]): InvoiceEntity[] =>
  invoices.filter(
    (invoice) =>
      invoice.outstanding > 0 ||
      invoice.status === 'partial' ||
      invoice.status === 'overdue' ||
      invoice.status === 'sent',
  );

/** Port of frontend `getDaysOverdue`. */
export const getDaysOverdue = (dueDate: string): number => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/** Top N pending collections by outstanding (descending). */
export const getPendingCollectionsTopN = (
  invoices: InvoiceEntity[],
  limit = 5,
): Array<{
  id: string;
  customer: string;
  outstanding: number;
  dueDate: string;
}> =>
  getCollectionInvoices(invoices)
    .filter((invoice) => invoice.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, limit)
    .map((invoice) => ({
      id: invoice.id,
      customer: invoice.customerName,
      outstanding: Number(invoice.outstanding || 0),
      dueDate: invoice.dueDate,
    }));
