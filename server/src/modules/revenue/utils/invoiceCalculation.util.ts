import type {
  InvoiceBillingType,
  InvoiceEntity,
  InvoiceLineItem,
  InvoiceStatus,
  PaymentEntity,
} from '../types/revenue.entities';

/** Round to 2 decimal places (currency). */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/** Tax amount from subtotal and percent (before optional override). */
export const computeTaxAmount = (subtotal: number, taxPercent: number): number =>
  roundMoney((subtotal * taxPercent) / 100);

export const buildLineItem = (input: {
  componentId: string;
  name: string;
  taxable: number;
  gstPercent: number;
}): InvoiceLineItem => {
  const taxable = roundMoney(input.taxable);
  const gstPercent = Number(input.gstPercent) || 0;
  const gstAmount = computeTaxAmount(taxable, gstPercent);
  return {
    componentId: input.componentId,
    name: input.name,
    taxable,
    gstPercent,
    gstAmount,
    total: roundMoney(taxable + gstAmount),
  };
};

/** Same billed base amounts, re-taxed at one rate (0 for a non-GST invoice). */
export const repriceLineItems = (
  lineItems: InvoiceLineItem[],
  gstPercent: number,
): InvoiceLineItem[] =>
  lineItems.map((line) =>
    buildLineItem({
      componentId: line.componentId,
      name: line.name,
      taxable: line.taxable,
      gstPercent,
    }),
  );

export const totalsFromLineItems = (
  lineItems: InvoiceLineItem[],
): { subtotal: number; taxPercent: number; tax: number; total: number } => {
  const subtotal = roundMoney(lineItems.reduce((sum, line) => sum + line.taxable, 0));
  const tax = roundMoney(lineItems.reduce((sum, line) => sum + line.gstAmount, 0));
  const rates = [...new Set(lineItems.map((line) => line.gstPercent))];
  const taxPercent =
    rates.length === 1 ? rates[0] : subtotal > 0 ? roundMoney((tax / subtotal) * 100) : 0;
  return { subtotal, taxPercent, tax, total: roundMoney(subtotal + tax) };
};

export const lineItemsMatchSubtotal = (
  lineItems: InvoiceLineItem[],
  subtotal: number,
): boolean =>
  lineItems.length > 0 &&
  Math.abs(lineItems.reduce((sum, line) => sum + line.taxable, 0) - subtotal) < 0.01;

export const resolveBillingType = (
  billingType: InvoiceBillingType | undefined,
  taxPercent: number | undefined,
): InvoiceBillingType => billingType ?? ((taxPercent ?? 0) > 0 ? 'gst' : 'non_gst');

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

const moneyEquals = (left: number, right: number): boolean => roundMoney(left) === roundMoney(right);

/**
 * Resolve subtotal / tax / total for invoice update.
 * A field that is omitted, or resent with the same value, leaves the stored
 * amounts untouched. Tax and total are rebuilt only when subtotal, GST, tax,
 * or total actually changes. An empty stored subtotal is not treated as a new
 * zero amount, so a GST-only edit cannot wipe a total that lives only in total.
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
  const subtotalChanged =
    input.subtotal !== undefined && !moneyEquals(input.subtotal, existing.subtotal);
  const percentChanged =
    input.taxPercent !== undefined && !moneyEquals(input.taxPercent, existing.taxPercent);
  const taxChanged = input.tax !== undefined && !moneyEquals(input.tax, existing.tax);
  const totalChanged = input.total !== undefined && !moneyEquals(input.total, existing.total);

  if (!subtotalChanged && !percentChanged && !taxChanged && !totalChanged) {
    return {
      subtotal: existing.subtotal,
      taxPercent: existing.taxPercent,
      tax: existing.tax,
      total: existing.total,
    };
  }

  const subtotal = input.subtotal !== undefined ? roundMoney(input.subtotal) : existing.subtotal;
  const taxPercent = input.taxPercent !== undefined ? input.taxPercent : existing.taxPercent;

  if (totalChanged && !subtotalChanged && !percentChanged && !taxChanged) {
    return {
      subtotal,
      taxPercent,
      tax: existing.tax,
      total: roundMoney(input.total ?? existing.total),
    };
  }

  const hasTaxableBase = subtotal > 0 || subtotalChanged;
  if (!hasTaxableBase && !taxChanged && !totalChanged) {
    return {
      subtotal: existing.subtotal,
      taxPercent,
      tax: existing.tax,
      total: existing.total,
    };
  }

  const tax = taxChanged
    ? roundMoney(input.tax ?? existing.tax)
    : subtotalChanged || percentChanged
      ? computeTaxAmount(subtotal, taxPercent)
      : existing.tax;
  const total = totalChanged ? roundMoney(input.total ?? existing.total) : roundMoney(subtotal + tax);

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
