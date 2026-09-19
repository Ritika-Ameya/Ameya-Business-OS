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

/** Map legacy sheet values to the current status vocabulary. */
export const normalizeInvoiceStatus = (raw: string | undefined | null): InvoiceStatus => {
  switch ((raw || '').trim().toLowerCase()) {
    case 'sent':
    case 'overdue':
      return 'due';
    case 'partial':
      return 'partially_paid';
    case 'draft':
      return 'draft';
    case 'due':
      return 'due';
    case 'partially_paid':
      return 'partially_paid';
    case 'paid':
      return 'paid';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'draft';
  }
};

export const resolveInvoiceStatus = (
  invoice: Pick<InvoiceEntity, 'status' | 'dueDate' | 'total'>,
  received: number,
): InvoiceStatus => {
  const current = normalizeInvoiceStatus(invoice.status);
  if (current === 'cancelled') {
    return 'cancelled';
  }

  const outstanding = computeOutstanding(invoice.total, received);

  if (outstanding <= 0.001) {
    return received > 0 || Number(invoice.total || 0) <= 0.001 ? 'paid' : current === 'draft' ? 'draft' : 'paid';
  }

  if (received > 0) {
    return 'partially_paid';
  }

  if (current === 'draft') {
    return 'draft';
  }

  return 'due';
};

export const applyBalance = (
  invoice: InvoiceEntity,
  payments: PaymentEntity[],
): Pick<InvoiceEntity, 'received' | 'outstanding' | 'status'> => {
  const status = resolveInvoiceStatus(invoice, computeReceived(payments));
  if (status === 'cancelled') {
    return {
      received: computeReceived(payments),
      outstanding: 0,
      status: 'cancelled',
    };
  }
  const received = computeReceived(payments);
  const outstanding = computeOutstanding(invoice.total, received);
  return {
    received,
    outstanding,
    status,
  };
};

/** Invoices that still count toward collections / customer outstanding. */
export const isCollectionInvoice = (
  invoice: Pick<InvoiceEntity, 'status' | 'outstanding'>,
): boolean => {
  const status = normalizeInvoiceStatus(invoice.status);
  if (status === 'cancelled' || status === 'draft' || status === 'paid') {
    return false;
  }
  return (
    Number(invoice.outstanding || 0) > 0 ||
    status === 'partially_paid' ||
    status === 'due'
  );
};

export const effectiveInvoiceOutstanding = (
  invoice: Pick<InvoiceEntity, 'status' | 'outstanding'>,
): number => {
  const status = normalizeInvoiceStatus(invoice.status);
  if (status === 'cancelled' || status === 'draft' || status === 'paid') {
    return 0;
  }
  return roundMoney(Number(invoice.outstanding || 0));
};

export const sumCollectionOutstandingByCustomerId = (
  invoices: InvoiceEntity[],
): Map<string, number> => {
  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    if (!invoice.customerId || !isCollectionInvoice(invoice)) continue;
    const next =
      (totals.get(invoice.customerId) ?? 0) +
      effectiveInvoiceOutstanding(invoice);
    totals.set(invoice.customerId, roundMoney(next));
  }
  return totals;
};

export const sumCollectionOutstandingForCustomer = (
  invoices: InvoiceEntity[],
  customerId: string,
): number =>
  roundMoney(
    invoices
      .filter(
        (invoice) =>
          invoice.customerId === customerId && isCollectionInvoice(invoice),
      )
      .reduce((sum, invoice) => sum + effectiveInvoiceOutstanding(invoice), 0),
  );
