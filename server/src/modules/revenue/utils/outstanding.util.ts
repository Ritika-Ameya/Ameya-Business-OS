import type { InvoiceEntity, InvoiceStatus, PaymentEntity } from '../types/revenue.entities';

export const computeReceived = (payments: PaymentEntity[]): number =>
  payments
    .filter((payment) => payment.status === 'received')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

export const resolveInvoiceStatus = (
  invoice: Pick<InvoiceEntity, 'status' | 'dueDate' | 'total'>,
  received: number,
): InvoiceStatus => {
  const outstanding = Math.max(0, Number(invoice.total || 0) - received);

  if (outstanding <= 0.001) {
    return 'paid';
  }

  if (received > 0) {
    return 'partial';
  }

  const due = new Date(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (invoice.dueDate && due < today && outstanding > 0) {
    return 'overdue';
  }

  if (invoice.status === 'draft') {
    return 'draft';
  }

  return invoice.status === 'sent' ? 'sent' : 'sent';
};

export const applyBalance = (
  invoice: InvoiceEntity,
  payments: PaymentEntity[],
): Pick<InvoiceEntity, 'received' | 'outstanding' | 'status'> => {
  const received = computeReceived(payments);
  const outstanding = Math.max(0, Number(invoice.total || 0) - received);
  return {
    received,
    outstanding,
    status: resolveInvoiceStatus(invoice, received),
  };
};
