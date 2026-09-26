import type { CustomerEntity } from '../../customers/types/customer.entities';
import type { DealComponentEntity, DealEntity } from '../../deals/types/deal.entities';
import {
  computeComponentLineTotal,
  computeComponentTaxable,
} from '../../deals/utils/componentAmount.util';
import {
  getComponentCurrentDueDate,
  hasRenewalFrequency,
} from '../../deals/utils/renewalHelpers.util';
import type { InvoiceEntity } from '../../revenue/types/revenue.entities';
import {
  effectiveInvoiceOutstanding,
  isCollectionInvoice,
} from '../../revenue/utils/invoiceCalculation.util';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import type {
  CanvasCard,
  ExpectedReceiptEntity,
  LeadTemperatureEntity,
  LeadTemperatureValue,
  ReceiptSourceType,
} from '../types/canvas.entities';

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const toLocalDateOnly = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const monthKeyFromDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})/.exec(isoDate.trim());
  return match ? `${match[1]}-${match[2]}` : 'unscheduled';
};

/** Keep the day-of-month when a receipt moves to another month. */
export const shiftDateToMonth = (isoDate: string, monthKey: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const requestedDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)?.[3];
  const day = requestedDay ? Number(requestedDay) : 15;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day || 15, 1), lastDay);
  return `${monthKey}-${pad2(safeDay)}`;
};

const companyNameOf = (customer: CustomerEntity | undefined, fallback = ''): string =>
  customer?.companyName?.trim() ||
  customer?.contactPerson?.trim() ||
  fallback.trim() ||
  'Untitled account';

const rowFor = (
  recordType: 'opportunity' | 'customer',
  temperature: LeadTemperatureValue | '',
): CanvasCard['rowKey'] => {
  if (recordType === 'customer') return 'customer';
  if (temperature === 'hot' || temperature === 'warm' || temperature === 'cold') return temperature;
  return 'unclassified';
};

const gstFromInclusive = (inclusive: number, taxPercent: number): Pick<
  CanvasCard,
  'amountExGst' | 'gstAmount' | 'gstPercent'
> => {
  const amount = roundMoney(inclusive);
  const percent = Number(taxPercent) || 0;
  if (percent <= 0) return { amountExGst: amount, gstAmount: 0, gstPercent: 0 };
  const amountExGst = roundMoney(amount / (1 + percent / 100));
  return { amountExGst, gstAmount: roundMoney(amount - amountExGst), gstPercent: percent };
};

const gstFromInvoice = (
  invoice: InvoiceEntity,
  inclusive: number,
): Pick<CanvasCard, 'amountExGst' | 'gstAmount' | 'gstPercent'> => {
  const amount = roundMoney(inclusive);
  const total = Number(invoice.total) || 0;
  const subtotal = Number(invoice.subtotal) || 0;
  if (total <= 0 || subtotal <= 0) return gstFromInclusive(amount, Number(invoice.taxPercent) || 0);
  const amountExGst = roundMoney((amount * subtotal) / total);
  const gstAmount = roundMoney(amount - amountExGst);
  const computed = amountExGst > 0 ? roundMoney((gstAmount / amountExGst) * 100) : 0;
  const stated = Number(invoice.taxPercent) || 0;
  const gstPercent = stated > 0 && Math.abs(computed - stated) < 0.6 ? stated : computed;
  return { amountExGst, gstAmount, gstPercent };
};

const gstFromComponent = (
  component: DealComponentEntity,
): Pick<CanvasCard, 'amountExGst' | 'gstAmount' | 'gstPercent'> => {
  const amountExGst = roundMoney(computeComponentTaxable(component));
  const inclusive = computeComponentLineTotal(component);
  return {
    amountExGst,
    gstAmount: roundMoney(inclusive - amountExGst),
    gstPercent: Number(component.gstPercent) || 0,
  };
};

const sourceForComponent = (component: DealComponentEntity): ReceiptSourceType => {
  if (component.billingType === 'monthly') return 'subscription';
  if (component.billingType === 'yearly') return 'license';
  return 'renewal';
};

const displayStatus = (
  stored: CanvasCard['status'],
  expectedDate: string,
  today: string,
  invoice?: InvoiceEntity,
): CanvasCard['status'] => {
  if (stored === 'cancelled' || stored === 'superseded' || stored === 'received') return stored;
  if (invoice?.status === 'cancelled') return 'cancelled';
  if (invoice && (invoice.status === 'paid' || effectiveInvoiceOutstanding(invoice) <= 0)) {
    return invoice.status === 'draft' ? stored : 'received';
  }
  if (expectedDate && expectedDate.slice(0, 10) < today) return 'overdue';
  return 'expected';
};

const countsAsUpcoming = (status: CanvasCard['status']): boolean =>
  status === 'expected' || status === 'overdue';

export const buildCanvasCards = (input: {
  customers: CustomerEntity[];
  deals: DealEntity[];
  components: DealComponentEntity[];
  invoices: InvoiceEntity[];
  receipts: ExpectedReceiptEntity[];
  temperatures: LeadTemperatureEntity[];
  today: string;
}): CanvasCard[] => {
  const customerById = new Map(input.customers.map((customer) => [customer.id, customer]));
  const dealById = new Map(input.deals.map((deal) => [deal.id, deal]));
  const invoiceById = new Map(input.invoices.map((invoice) => [invoice.id, invoice]));
  const componentById = new Map(input.components.map((component) => [component.id, component]));
  const temperatureByCustomer = new Map<string, LeadTemperatureValue>();
  for (const row of input.temperatures) {
    if (row.customerId) temperatureByCustomer.set(row.customerId, row.temperature);
  }

  const activeReceipts = input.receipts.filter((receipt) => receipt.status !== 'superseded');
  const coveredInvoices = new Set(
    activeReceipts.map((receipt) => receipt.invoiceId).filter(Boolean),
  );
  const coveredComponents = new Set(
    activeReceipts.map((receipt) => receipt.componentId).filter(Boolean),
  );
  const openInvoiceComponents = new Set<string>();
  for (const invoice of input.invoices) {
    if (!isCollectionInvoice(invoice)) continue;
    for (const componentId of invoice.componentIds ?? []) {
      if (componentId) openInvoiceComponents.add(componentId);
    }
  }

  const cards: CanvasCard[] = [];

  const pushReceipt = (card: CanvasCard) => {
    cards.push(card);
  };

  for (const receipt of activeReceipts) {
    if (receipt.origin === 'dismissed') continue;
    const customer = customerById.get(receipt.customerId);
    const invoice = receipt.invoiceId ? invoiceById.get(receipt.invoiceId) : undefined;
    const deal = receipt.dealId ? dealById.get(receipt.dealId) : undefined;
    const recordType = customer?.recordType ?? 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(receipt.customerId) ?? '' : '';
    const expectedDate = receipt.expectedDate?.slice(0, 10) ?? '';
    const status = displayStatus(receipt.status, expectedDate, input.today, invoice);
    if (status === 'superseded') continue;
    const component = receipt.componentId ? componentById.get(receipt.componentId) : undefined;
    const gst = invoice
      ? gstFromInvoice(invoice, receipt.expectedAmount)
      : gstFromInclusive(receipt.expectedAmount, Number(component?.gstPercent) || 0);

    pushReceipt({
      id: receipt.id,
      persistedId: receipt.id,
      kind: 'receipt',
      customerId: receipt.customerId,
      companyName: companyNameOf(customer, invoice?.customerName || deal?.customerName),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: expectedDate ? monthKeyFromDate(expectedDate) : 'unscheduled',
      expectedAmount: roundMoney(receipt.expectedAmount),
      ...gst,
      expectedDate,
      sourceType: receipt.sourceType,
      reason: receipt.reason,
      dealId: receipt.dealId,
      dealTitle: deal?.title || invoice?.dealTitle || '',
      invoiceId: receipt.invoiceId,
      invoiceNumber: invoice?.invoiceNumber || '',
      componentId: receipt.componentId,
      status,
      liveBalance: invoice ? effectiveInvoiceOutstanding(invoice) : null,
      amountOverridden: true,
      origin: receipt.origin,
      installmentIndex: receipt.installmentIndex || 1,
      currency: receipt.currency || invoice?.currency || 'INR',
    });
  }

  for (const invoice of input.invoices) {
    if (!isCollectionInvoice(invoice)) continue;
    if (effectiveInvoiceOutstanding(invoice) <= 0) continue;
    if (coveredInvoices.has(invoice.id)) continue;
    const customer = customerById.get(invoice.customerId);
    const recordType = customer?.recordType ?? 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(invoice.customerId) ?? '' : '';
    const expectedDate = invoice.dueDate?.slice(0, 10) ?? '';
    const deal = invoice.dealId ? dealById.get(invoice.dealId) : undefined;
    pushReceipt({
      id: `sug-invoice-${invoice.id}`,
      persistedId: null,
      kind: 'receipt',
      customerId: invoice.customerId,
      companyName: companyNameOf(customer, invoice.customerName),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: expectedDate ? monthKeyFromDate(expectedDate) : 'unscheduled',
      expectedAmount: effectiveInvoiceOutstanding(invoice),
      ...gstFromInvoice(invoice, effectiveInvoiceOutstanding(invoice)),
      expectedDate,
      sourceType: 'invoice_balance',
      reason: invoice.invoiceNumber
        ? `Remaining balance · ${invoice.invoiceNumber}`
        : 'Remaining invoice balance',
      dealId: invoice.dealId,
      dealTitle: deal?.title || invoice.dealTitle || '',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      componentId: '',
      status: displayStatus('expected', expectedDate, input.today, invoice),
      liveBalance: effectiveInvoiceOutstanding(invoice),
      amountOverridden: false,
      origin: 'suggestion',
      installmentIndex: 1,
      currency: invoice.currency || 'INR',
    });
  }

  for (const component of input.components) {
    if (!hasRenewalFrequency(component.renewalFrequency)) continue;
    if (coveredComponents.has(component.id)) continue;
    if (openInvoiceComponents.has(component.id)) continue;
    const deal = dealById.get(component.dealId);
    if (!deal?.customerId) continue;
    const dueDate = getComponentCurrentDueDate(component)?.slice(0, 10) ?? '';
    if (!dueDate) continue;
    const customer = customerById.get(deal.customerId);
    const recordType = customer?.recordType ?? 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(deal.customerId) ?? '' : '';
    const sourceType = sourceForComponent(component);
    pushReceipt({
      id: `sug-component-${component.id}`,
      persistedId: null,
      kind: 'receipt',
      customerId: deal.customerId,
      companyName: companyNameOf(customer, deal.customerName),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: monthKeyFromDate(dueDate),
      expectedAmount: computeComponentLineTotal(component),
      ...gstFromComponent(component),
      expectedDate: dueDate,
      sourceType,
      reason: component.name?.trim() || 'Renewal',
      dealId: deal.id,
      dealTitle: deal.title,
      invoiceId: '',
      invoiceNumber: '',
      componentId: component.id,
      status: displayStatus('expected', dueDate, input.today),
      liveBalance: null,
      amountOverridden: false,
      origin: 'suggestion',
      installmentIndex: 1,
      currency: deal.currency || 'INR',
    });
  }

  const upcomingCustomers = new Set(
    cards.filter((card) => countsAsUpcoming(card.status)).map((card) => card.customerId),
  );

  for (const customer of input.customers) {
    if (upcomingCustomers.has(customer.id)) continue;
    const recordType = customer.recordType === 'opportunity' ? 'opportunity' : 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(customer.id) ?? '' : '';
    cards.push({
      id: `acct-${customer.id}`,
      persistedId: null,
      kind: 'account',
      customerId: customer.id,
      companyName: companyNameOf(customer),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: 'unscheduled',
      expectedAmount: null,
      amountExGst: null,
      gstAmount: null,
      gstPercent: null,
      expectedDate: '',
      sourceType: '',
      reason: 'No expected receipt yet',
      dealId: '',
      dealTitle: '',
      invoiceId: '',
      invoiceNumber: '',
      componentId: '',
      status: 'expected',
      liveBalance: null,
      amountOverridden: false,
      origin: 'account',
      installmentIndex: 0,
      currency: 'INR',
    });
  }

  return cards;
};
