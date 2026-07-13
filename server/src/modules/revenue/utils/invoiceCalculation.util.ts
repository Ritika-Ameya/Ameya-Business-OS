import type { InvoiceEntity, InvoiceStatus, PaymentEntity } from '../types/revenue.entities';

/** Round to 2 decimal places (currency). */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/** Tax amount from subtotal and percent (before optional override). */
export const computeTaxAmount = (subtotal: number, taxPercent: number): number =>
  roundMoney((subtotal * taxPercent) / 100);

/** Outstanding balance: invoice total minus paid amount, floored at zero. */
export const computeOutstanding = (total: number, received: number): number =>
  Math.max(0, Number(total || 0) - Number(received || 0));

/** Sum of payments with status `received`. */
export const computeReceived = (payments: PaymentEntity[]): number =>
  payments
    .filter((payment) => payment.status === 'received')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

/**
 * Resolve subtotal / tax / total for invoice create.
 * Matches prior service behaviour: optional tax/total overrides, else derived.
 */
export const resolveCreateAmounts = (input: {
  subtotal: number;
  taxPercent: number;
  tax?: number;
  total?: number;
}): { subtotal: number; taxPercent: number; tax: number; total: number } => {
  const taxPercent = input.taxPercent;
  const subtotal = roundMoney(input.subtotal);
  const tax =
    input.tax !== undefined
      ? roundMoney(input.tax)
      : computeTaxAmount(subtotal, taxPercent);
  const total = roundMoney(input.total ?? subtotal + tax);
  return { subtotal, taxPercent, tax, total };
};

/**
 * Resolve subtotal / tax / total for invoice update.
 * Recalculates tax when subtotal or taxPercent changes (unless tax overridden);
 * recalculates total when any amount inputs change (unless total overridden).
 */
export const resolveUpdateAmounts = (
  existing: Pick<InvoiceEntity, 'subtotal' | 'taxPercent' | 'tax' | 'total'>,
  input: {
    subtotal?: number;
    taxPercent?: number;
    tax?: number;
    total?: number;
  },
): { subtotal: number; taxPercent: number; tax: number; total: number } => {
  const subtotal = input.subtotal !== undefined ? roundMoney(input.subtotal) : existing.subtotal;
  const taxPercent = input.taxPercent !== undefined ? input.taxPercent : existing.taxPercent;
  const tax =
    input.tax !== undefined
      ? roundMoney(input.tax)
      : input.subtotal !== undefined || input.taxPercent !== undefined
        ? computeTaxAmount(subtotal, taxPercent)
        : existing.tax;
  const total =
    input.total !== undefined
      ? roundMoney(input.total)
      : input.subtotal !== undefined || input.taxPercent !== undefined || input.tax !== undefined
        ? roundMoney(subtotal + tax)
        : existing.total;

  return { subtotal, taxPercent, tax, total };
};

export const resolveInvoiceStatus = (
  invoice: Pick<InvoiceEntity, 'status' | 'dueDate' | 'total'>,
  received: number,
): InvoiceStatus => {
  const outstanding = computeOutstanding(invoice.total, received);

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
  const outstanding = computeOutstanding(invoice.total, received);
  return {
    received,
    outstanding,
    status: resolveInvoiceStatus(invoice, received),
  };
};
