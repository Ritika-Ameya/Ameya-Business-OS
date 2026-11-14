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
import type { InvoiceEntity, PaymentEntity } from '../../revenue/types/revenue.entities';
import {
  effectiveInvoiceOutstanding,
  isCollectionInvoice,
} from '../../revenue/utils/invoiceCalculation.util';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import { parseReceivedLog, settledByEntry, settledFromLog } from './receivedLog.util';
import {
  collectionAccountForExpected,
  collectionAccountForPayment,
} from '../../revenue/utils/collectionAccount.util';
import type {
  CanvasCard,
  CanvasForecastHistory,
  CanvasPaidEntry,
  CanvasRenewalReminder,
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

/** Canvas title: customer / opportunity name first, then company. */
const companyNameOf = (customer: CustomerEntity | undefined, fallback = ''): string =>
  customer?.contactPerson?.trim() ||
  customer?.companyName?.trim() ||
  fallback.trim() ||
  'Untitled account';

/** Company line under the title when it differs from the person name. */
const organizationNameOf = (customer: CustomerEntity | undefined): string => {
  const company = customer?.companyName?.trim() || '';
  const person = customer?.contactPerson?.trim() || '';
  if (company && person && company.toLowerCase() !== person.toLowerCase()) return company;
  return '';
};

const rowFor = (
  recordType: 'opportunity' | 'customer' | 'uncategorized',
  temperature: LeadTemperatureValue | '',
): CanvasCard['rowKey'] => {
  if (recordType === 'customer') return 'customer';
  if (
    recordType === 'opportunity' &&
    (temperature === 'hot' || temperature === 'warm' || temperature === 'cold')
  ) {
    return temperature;
  }
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

/**
 * A hand-entered receipt often stores the deal's GST-inclusive price without a
 * component link. When that amount is one component's price including GST, use
 * that component's rate so the canvas does not call it "No GST".
 */
/** The one component on this deal whose GST-inclusive total equals the receipt. */
export const componentIdMatchingDealTotal = (
  dealId: string,
  expectedAmount: number,
  components: DealComponentEntity[],
): string => {
  const amount = roundMoney(expectedAmount);
  if (!dealId || amount <= 0) return '';
  const matches = components.filter(
    (component) =>
      component.dealId === dealId && Math.abs(computeComponentLineTotal(component) - amount) < 0.6,
  );
  return matches.length === 1 ? matches[0].id : '';
};

const gstPercentMatchingDealPrice = (
  receipt: ExpectedReceiptEntity,
  components: DealComponentEntity[],
): number => {
  const componentId = componentIdMatchingDealTotal(
    receipt.dealId,
    receipt.expectedAmount,
    components,
  );
  const matched = componentId
    ? components.find((component) => component.id === componentId)
    : undefined;
  return Number(matched?.gstPercent) || 0;
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

/** Forecast and invoice belong to the same cycle when their dates are within three weeks. */
const sameCollectionCycle = (left?: string, right?: string): boolean => {
  const a = left?.slice(0, 10) ?? '';
  const b = right?.slice(0, 10) ?? '';
  if (!a || !b) return true;
  const aTime = Date.parse(a);
  const bTime = Date.parse(b);
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return true;
  return Math.abs(aTime - bTime) / 86_400_000 <= 21;
};

const openInvoicesForComponent = (
  invoices: InvoiceEntity[],
  componentId: string,
): InvoiceEntity[] =>
  invoices.filter(
    (invoice) =>
      isCollectionInvoice(invoice) && (invoice.componentIds ?? []).includes(componentId),
  );

/**
 * Taxable amount already on an open invoice for this cycle. Unknown multi-component
 * splits count as fully billed. Invoices from an earlier/later cycle are ignored so
 * a prior open invoice cannot wipe the next renewal off To collect.
 */
const invoicedTaxableForComponent = (
  invoices: InvoiceEntity[],
  componentId: string,
  dueDate = '',
): number => {
  let sum = 0;
  let known = false;
  for (const invoice of openInvoicesForComponent(invoices, componentId)) {
    if (dueDate && !sameCollectionCycle(dueDate, invoice.dueDate)) continue;
    const lines = (invoice.lineItems ?? []).filter((line) => line.componentId === componentId);
    if (lines.length > 0) {
      known = true;
      sum += lines.reduce((total, line) => total + Number(line.taxable || 0), 0);
      continue;
    }
    const ids = (invoice.componentIds ?? []).filter(Boolean);
    if (ids.length === 1 && ids[0] === componentId) {
      known = true;
      sum += Number(invoice.subtotal || 0);
    }
  }
  return known ? roundMoney(sum) : Number.POSITIVE_INFINITY;
};

const sourceForComponent = (component: DealComponentEntity): ReceiptSourceType => {
  if (!hasRenewalFrequency(component.renewalFrequency) || component.billingType === 'one-time') {
    return 'other';
  }
  if (component.billingType === 'monthly') return 'subscription';
  if (component.billingType === 'yearly') return 'license';
  if (component.billingType === 'half-yearly') return 'subscription';
  return 'renewal';
};

/** Group key so the drawer can list every part of a multi-installment forecast. */
const installmentSeriesIdOf = (receipt: {
  invoiceId?: string;
  sourceRefType?: string;
  sourceRefId?: string;
  origin?: string;
  customerId?: string;
  dealId?: string;
  componentId?: string;
  sourceType?: string;
}): string => {
  if (receipt.invoiceId) return `invoice:${receipt.invoiceId}`;
  if (receipt.sourceRefType === 'series' && receipt.sourceRefId) {
    return `series:${receipt.sourceRefId}`;
  }
  // Legacy multi-create rows shared customer/deal/component refs without a series id.
  if (receipt.origin === 'installment') {
    return [
      'legacy',
      receipt.customerId || '',
      receipt.dealId || '',
      receipt.componentId || '',
      receipt.sourceType || '',
      receipt.sourceRefId || '',
    ].join(':');
  }
  return '';
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
  // A receipt marked paid must not hide what is still owed: the invoice's remaining
  // balance, or the component's next renewal cycle once its due date has moved on.
  const paidReceipt = (receipt: ExpectedReceiptEntity): boolean =>
    receipt.status === 'received' && receipt.origin !== 'dismissed';
  const coveredInvoices = new Set(
    activeReceipts
      .filter(
        (receipt) =>
          receipt.status === 'expected' &&
          receipt.origin !== 'dismissed' &&
          Boolean(receipt.invoiceId),
      )
      .map((receipt) => receipt.invoiceId),
  );
  const componentIdForReceipt = (receipt: ExpectedReceiptEntity): string =>
    receipt.componentId ||
    componentIdMatchingDealTotal(receipt.dealId, receipt.expectedAmount, input.components);

  /**
   * A receipt only covers the component's *current* unpaid cycle. An older unpaid
   * receipt (or a paid prior cycle) must not hide the next renewal on the board —
   * otherwise Renewals can list money that To collect never shows.
   */
  const coveredComponents = new Set(
    activeReceipts
      .map((receipt) => {
        const componentId = componentIdForReceipt(receipt);
        if (!componentId) return '';
        const component = componentById.get(componentId);
        const currentDue = component
          ? getComponentCurrentDueDate(component).slice(0, 10)
          : '';
        const receiptDate = (receipt.expectedDate || '').slice(0, 10);
        if (currentDue && !sameCollectionCycle(receiptDate, currentDue)) return '';
        if (paidReceipt(receipt) && currentDue && receiptDate !== currentDue) return '';
        return componentId;
      })
      .filter(Boolean),
  );

  /** Open invoices only block / replace the suggestion for the same billing cycle. */
  const openInvoiceCoversCycle = (component: DealComponentEntity, dueDate: string): boolean => {
    const open = openInvoicesForComponent(input.invoices, component.id);
    if (open.length === 0) return false;
    if (!dueDate) return true;
    return open.some((invoice) => sameCollectionCycle(dueDate, invoice.dueDate));
  };
  const suppressedInvoices = new Set(
    input.receipts
      .filter((receipt) => receipt.suppressInvoice && receipt.invoiceId)
      .map((receipt) => receipt.invoiceId),
  );
  const stillOpen = (receipt: ExpectedReceiptEntity): number =>
    roundMoney(Math.max(0, Number(receipt.expectedAmount || 0) - settledFromLog(receipt.receivedLog)));
  const displayAmountById = new Map<string, number>();
  const receiptsByInvoice = new Map<string, ExpectedReceiptEntity[]>();
  for (const receipt of activeReceipts) {
    if (receipt.origin === 'dismissed' || receipt.status !== 'expected') continue;
    if (!receipt.invoiceId) {
      displayAmountById.set(receipt.id, stillOpen(receipt));
      continue;
    }
    const list = receiptsByInvoice.get(receipt.invoiceId) ?? [];
    list.push(receipt);
    receiptsByInvoice.set(receipt.invoiceId, list);
  }
  for (const [invoiceId, list] of receiptsByInvoice) {
    const invoice = invoiceById.get(invoiceId);
    let left = invoice
      ? effectiveInvoiceOutstanding(invoice)
      : list.reduce((sum, receipt) => sum + stillOpen(receipt), 0);
    const ordered = [...list].sort(
      (a, b) =>
        a.expectedDate.localeCompare(b.expectedDate) ||
        (a.installmentIndex || 0) - (b.installmentIndex || 0),
    );
    for (const receipt of ordered) {
      const show = roundMoney(Math.min(stillOpen(receipt), Math.max(0, left)));
      displayAmountById.set(receipt.id, show);
      left = roundMoney(left - show);
    }
  }

  const cards: CanvasCard[] = [];

  const pushReceipt = (card: CanvasCard) => {
    cards.push(card);
  };

  for (const receipt of activeReceipts) {
    if (receipt.origin === 'dismissed') continue;
    if (receipt.customerId && !customerById.has(receipt.customerId)) continue;
    const customer = customerById.get(receipt.customerId);
    const invoice = receipt.invoiceId ? invoiceById.get(receipt.invoiceId) : undefined;
    const deal = receipt.dealId ? dealById.get(receipt.dealId) : undefined;
    const recordType = customer?.recordType ?? 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(receipt.customerId) ?? '' : '';
    const expectedDate = receipt.expectedDate?.slice(0, 10) ?? '';
    const status = displayStatus(receipt.status, expectedDate, input.today, invoice);
    if (status === 'superseded' || status === 'cancelled') continue;
    const originalAmount = roundMoney(Number(receipt.expectedAmount || 0));
    const settledAmount = settledFromLog(receipt.receivedLog);
    const fromLogOrOverride =
      displayAmountById.get(receipt.id) ??
      roundMoney(Math.max(0, originalAmount - settledAmount));
    // Status received means the forecast is closed even if receivedLog was not rewritten.
    const shownAmount = status === 'received' ? 0 : fromLogOrOverride;
    const receivedAmount =
      status === 'received'
        ? originalAmount
        : roundMoney(Math.max(0, originalAmount - shownAmount));
    // Fully paid forecasts drop off the board. Multi-installment siblings stay so the
    // drawer can still show Original / Received / Pending for the full schedule.
    const seriesId = installmentSeriesIdOf(receipt);
    if (shownAmount <= 0.009 && originalAmount > 0.009 && !seriesId) continue;
    const componentId = componentIdForReceipt(receipt);
    // Same-cycle forecast is replaced by the invoice. A later cycle stays visible.
    if (
      !receipt.invoiceId &&
      componentId &&
      receipt.status === 'expected' &&
      openInvoicesForComponent(input.invoices, componentId).some((invoice) =>
        sameCollectionCycle(receipt.expectedDate, invoice.dueDate),
      )
    ) {
      continue;
    }
    if (
      !receipt.invoiceId &&
      receipt.status === 'expected' &&
      receipt.sourceType === 'deal_expected' &&
      receipt.dealId &&
      input.invoices.some(
        (invoice) =>
          isCollectionInvoice(invoice) &&
          invoice.dealId === receipt.dealId &&
          sameCollectionCycle(receipt.expectedDate, invoice.dueDate) &&
          (!receipt.componentId || (invoice.componentIds ?? []).includes(receipt.componentId)),
      )
    ) {
      continue;
    }
    const component = componentId ? componentById.get(componentId) : undefined;
    const componentPercent = Number(component?.gstPercent) || 0;
    const chosenPercent = receipt.gstPercent;
    const gst = invoice
      ? gstFromInvoice(invoice, shownAmount)
      : chosenPercent != null
        ? gstFromInclusive(shownAmount, chosenPercent)
        : gstFromInclusive(
            shownAmount,
            componentPercent > 0
              ? componentPercent
              : gstPercentMatchingDealPrice(receipt, input.components),
          );

    pushReceipt({
      id: receipt.id,
      persistedId: receipt.id,
      kind: 'receipt',
      customerId: receipt.customerId,
      companyName: companyNameOf(customer, invoice?.customerName || deal?.customerName),
      organizationName: organizationNameOf(customer),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: expectedDate ? monthKeyFromDate(expectedDate) : 'unscheduled',
      expectedAmount: originalAmount <= 0.009 && shownAmount <= 0.009 ? null : shownAmount,
      originalAmount: originalAmount > 0.009 ? originalAmount : null,
      receivedAmount: receivedAmount > 0.009 ? receivedAmount : 0,
      seriesDealTotal:
        Number(receipt.seriesDealTotal) > 0.009 ? roundMoney(Number(receipt.seriesDealTotal)) : null,
      ...gst,
      expectedDate,
      sourceType: receipt.sourceType,
      reason: receipt.reason,
      dealId: receipt.dealId,
      dealTitle: deal?.title || invoice?.dealTitle || '',
      invoiceId: receipt.invoiceId,
      invoiceNumber: invoice?.invoiceNumber || '',
      componentId,
      status,
      liveBalance: invoice ? effectiveInvoiceOutstanding(invoice) : null,
      amountOverridden: true,
      origin: receipt.origin,
      installmentIndex: receipt.installmentIndex || 1,
      installmentSeriesId: installmentSeriesIdOf(receipt),
      currency: receipt.currency || invoice?.currency || 'INR',
      collectionAccount: collectionAccountForExpected({
        internationalClient: Boolean(customer?.internationalClient),
        gstPercent: gst.gstPercent,
        billingType: invoice?.billingType,
      }),
      internationalClient: Boolean(customer?.internationalClient),
    });
  }

  for (const invoice of input.invoices) {
    if (!isCollectionInvoice(invoice)) continue;
    if (effectiveInvoiceOutstanding(invoice) <= 0) continue;
    if (coveredInvoices.has(invoice.id)) continue;
    if (suppressedInvoices.has(invoice.id)) continue;
    if (invoice.customerId && !customerById.has(invoice.customerId)) continue;
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
      organizationName: organizationNameOf(customer),
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
      collectionAccount: collectionAccountForExpected({
        internationalClient: Boolean(customer?.internationalClient),
        gstPercent: Number(invoice.taxPercent) || 0,
        billingType: invoice.billingType,
      }),
      internationalClient: Boolean(customer?.internationalClient),
    });
  }

  for (const component of input.components) {
    const dueDate = getComponentCurrentDueDate(component)?.slice(0, 10) ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) continue;
    const recurring = hasRenewalFrequency(component.renewalFrequency);
    // One-time stays off the canvas until a first billing date is saved.
    if (!recurring && !(component.renewalStartDate || component.renewalDate || '').trim()) {
      continue;
    }
    if (coveredComponents.has(component.id)) continue;
    if (openInvoiceCoversCycle(component, dueDate)) continue;
    const deal = dealById.get(component.dealId);
    if (!deal?.customerId) continue;
    if (!customerById.has(deal.customerId)) continue;
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
      organizationName: organizationNameOf(customer),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: monthKeyFromDate(dueDate),
      expectedAmount: computeComponentLineTotal(component),
      ...gstFromComponent(component),
      expectedDate: dueDate,
      sourceType,
      reason: component.name?.trim() || (recurring ? 'Renewal' : 'One-time'),
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
      collectionAccount: collectionAccountForExpected({
        internationalClient: Boolean(customer?.internationalClient),
        gstPercent: Number(component.gstPercent) || 0,
      }),
      internationalClient: Boolean(customer?.internationalClient),
    });
  }

  for (const component of input.components) {
    const dueDate = getComponentCurrentDueDate(component)?.slice(0, 10) ?? '';
    if (!openInvoiceCoversCycle(component, dueDate)) continue;
    const taxable = roundMoney(computeComponentTaxable(component));
    const invoiced = invoicedTaxableForComponent(input.invoices, component.id, dueDate);
    const remainderBase = roundMoney(taxable - invoiced);
    if (remainderBase <= 0.5 || !Number.isFinite(remainderBase)) continue;
    const deal = dealById.get(component.dealId);
    if (!deal?.customerId || !customerById.has(deal.customerId)) continue;
    const customer = customerById.get(deal.customerId);
    const recordType = customer?.recordType ?? 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(deal.customerId) ?? '' : '';
    const cashOnly = openInvoicesForComponent(input.invoices, component.id).every(
      (invoice) => invoice.billingType === 'non_gst',
    );
    const gstPercent =
      cashOnly || customer?.internationalClient ? 0 : Number(component.gstPercent) || 0;
    const gstAmount = roundMoney((remainderBase * gstPercent) / 100);
    const expectedAmount = roundMoney(remainderBase + gstAmount);
    pushReceipt({
      id: `sug-remainder-${component.id}`,
      persistedId: null,
      kind: 'receipt',
      customerId: deal.customerId,
      companyName: companyNameOf(customer, deal.customerName),
      organizationName: organizationNameOf(customer),
      recordType,
      temperature,
      rowKey: rowFor(recordType, temperature),
      monthKey: dueDate ? monthKeyFromDate(dueDate) : 'unscheduled',
      expectedAmount,
      amountExGst: remainderBase,
      gstAmount,
      gstPercent,
      expectedDate: dueDate,
      sourceType: sourceForComponent(component),
      reason: `${component.name?.trim() || 'Component'} · not yet billed`,
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
      collectionAccount: collectionAccountForExpected({
        internationalClient: Boolean(customer?.internationalClient),
        gstPercent,
      }),
      internationalClient: Boolean(customer?.internationalClient),
    });
  }

  const upcomingCustomers = new Set(
    cards.filter((card) => countsAsUpcoming(card.status)).map((card) => card.customerId),
  );

  for (const customer of input.customers) {
    if (upcomingCustomers.has(customer.id)) continue;
    const recordType =
      customer.recordType === 'opportunity' || customer.recordType === 'uncategorized'
        ? customer.recordType
        : 'customer';
    const temperature =
      recordType === 'opportunity' ? temperatureByCustomer.get(customer.id) ?? '' : '';
    cards.push({
      id: `acct-${customer.id}`,
      persistedId: null,
      kind: 'account',
      customerId: customer.id,
      companyName: companyNameOf(customer),
      organizationName: organizationNameOf(customer),
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
      collectionAccount: customer.internationalClient ? 'innovex' : 'ritika',
      internationalClient: Boolean(customer.internationalClient),
    });
  }

  const seriesCounts = new Map<string, number>();
  for (const card of cards) {
    const seriesId = card.installmentSeriesId?.trim();
    if (!seriesId || card.kind !== 'receipt') continue;
    if (card.status === 'cancelled' || card.status === 'superseded') continue;
    seriesCounts.set(seriesId, (seriesCounts.get(seriesId) ?? 0) + 1);
  }
  for (const card of cards) {
    const seriesId = card.installmentSeriesId?.trim();
    if (!seriesId) continue;
    const count = seriesCounts.get(seriesId) ?? 0;
    if (count > 1) card.installmentCount = count;
  }

  return cards;
};

const nextMonthKey = (today: string): string => {
  const match = /^(\d{4})-(\d{2})/.exec(today);
  if (!match) return '';
  return monthKeyFromDate(toLocalDateOnly(new Date(Number(match[1]), Number(match[2]), 1)));
};

/**
 * The current unpaid cycle of every renewing component: the same components the
 * board shows as renewal cards, so the page can list the renewals of whichever
 * months are on screen. Computed on every read, so nothing is stored and a paid
 * cycle (which rolls the component's due date forward) drops out on its own.
 */
export const buildRenewalReminders = (input: {
  customers: CustomerEntity[];
  deals: DealEntity[];
  components: DealComponentEntity[];
  invoices: InvoiceEntity[];
  today: string;
}): CanvasRenewalReminder[] => {
  const customerById = new Map(input.customers.map((customer) => [customer.id, customer]));
  const dealById = new Map(input.deals.map((deal) => [deal.id, deal]));
  const openInvoiceByComponent = new Map<string, InvoiceEntity>();
  for (const invoice of input.invoices) {
    if (!isCollectionInvoice(invoice)) continue;
    for (const componentId of invoice.componentIds ?? []) {
      if (componentId && !openInvoiceByComponent.has(componentId)) {
        openInvoiceByComponent.set(componentId, invoice);
      }
    }
  }

  const thisMonth = monthKeyFromDate(input.today);
  const nextMonth = nextMonthKey(input.today);
  const reminders: CanvasRenewalReminder[] = [];

  for (const component of input.components) {
    if (!hasRenewalFrequency(component.renewalFrequency)) continue;
    const deal = dealById.get(component.dealId);
    if (!deal?.customerId) continue;
    const customer = customerById.get(deal.customerId);
    if (!customer) continue;
    const dueDate = getComponentCurrentDueDate(component).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) continue;
    if ((component.lastRenewedDate || '').slice(0, 10) === dueDate) continue;

    const invoice = openInvoiceByComponent.get(component.id);
    reminders.push({
      id: `renewal-${component.id}`,
      componentId: component.id,
      componentName: component.name?.trim() || 'Renewal',
      customerId: customer.id,
      companyName: companyNameOf(customer, deal.customerName),
      dealId: deal.id,
      dealTitle: deal.title,
      renewalDate: dueDate,
      renewalFrequency: component.renewalFrequency,
      lastRenewedDate: (component.lastRenewedDate || '').slice(0, 10),
      amount: computeComponentLineTotal(component),
      status:
        dueDate < input.today
          ? 'overdue'
          : monthKeyFromDate(dueDate) === thisMonth
            ? 'this_month'
            : monthKeyFromDate(dueDate) === nextMonth
              ? 'next_month'
              : 'later',
      invoiceId: invoice?.id ?? '',
      invoiceNumber: invoice?.invoiceNumber ?? '',
    });
  }

  return reminders.sort(
    (a, b) => a.renewalDate.localeCompare(b.renewalDate) || a.companyName.localeCompare(b.companyName),
  );
};

/** Received payments, for the Paid total of whichever months are on screen. */
export const buildPaidEntries = (input: {
  customers: CustomerEntity[];
  invoices: InvoiceEntity[];
  payments: PaymentEntity[];
  receipts?: ExpectedReceiptEntity[];
}): CanvasPaidEntry[] => {
  const customerById = new Map(input.customers.map((customer) => [customer.id, customer]));
  const invoiceById = new Map(input.invoices.map((invoice) => [invoice.id, invoice]));
  const entries: CanvasPaidEntry[] = [];
  for (const payment of input.payments) {
    if (payment.status !== 'received' || payment.isDeleted) continue;
    const invoice = invoiceById.get(payment.invoiceId);
    if (!invoice || invoice.status === 'cancelled') continue;
    const paidAt = (payment.paidAt || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) continue;
    const customerId = payment.customerId || invoice.customerId;
    entries.push({
      id: payment.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId,
      companyName: companyNameOf(customerById.get(customerId), invoice.customerName),
      amount: roundMoney(Number(payment.amount) || 0),
      paidAt,
      tdsAmount: roundMoney(Number(payment.tdsAmount) || 0),
      tdsSettles: Boolean(payment.tdsSettles),
      receivedAccount:
        payment.receivedAccount === 'other'
          ? 'other'
          : payment.receivedAccount === 'gst'
            ? 'gst'
            : undefined,
      collectionAccount: collectionAccountForPayment({
        internationalClient: Boolean(customerById.get(customerId)?.internationalClient),
        receivedAccount: payment.receivedAccount || '',
        billingType: invoice.billingType,
      }),
    });
  }
  for (const receipt of input.receipts ?? []) {
    if (receipt.isDeleted || receipt.invoiceId) continue;
    const customer = customerById.get(receipt.customerId);
    parseReceivedLog(receipt.receivedLog).forEach((entry, index) => {
      entries.push({
        id: `${receipt.id}-${entry.date}-${entry.amount}-${index}`,
        invoiceId: '',
        invoiceNumber: '',
        customerId: receipt.customerId,
        companyName: companyNameOf(customer),
        amount: entry.amount,
        paidAt: entry.date,
        tdsAmount: entry.tdsAmount,
        tdsSettles: entry.tdsSettles,
        receivedAccount: entry.account,
        receiptId: receipt.id,
        receiptPaymentIndex: index,
        collectionAccount: collectionAccountForExpected({
          internationalClient: Boolean(customer?.internationalClient),
          gstPercent: entry.account === 'gst' ? 18 : 0,
          billingType: entry.account === 'other' ? 'non_gst' : 'gst',
        }),
      });
    });
  }
  return entries;
};

const dateOnly = (value: string | undefined): string => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec((value ?? '').trim());
  return match ? match[1] : '';
};

interface HistoryStep {
  date: string;
  amount: number;
  tdsAmount: number;
  tdsSettles: boolean;
  order: number;
  mode?: string;
  receivedAccount?: 'gst' | 'other';
  receiptPaymentIndex?: number;
}

/**
 * Attaches the payment story to a forecast that still has a balance.
 * The stored expected amount stays as it was created. Each payment is listed
 * with its date, and the card amount stays the remaining balance.
 */
export const withForecastHistory = (input: {
  cards: CanvasCard[];
  receipts: ExpectedReceiptEntity[];
  invoices: InvoiceEntity[];
  payments: PaymentEntity[];
}): CanvasCard[] => {
  const receiptById = new Map(input.receipts.map((receipt) => [receipt.id, receipt]));
  const invoiceById = new Map(input.invoices.map((invoice) => [invoice.id, invoice]));
  const openReceiptsByInvoice = new Map<string, ExpectedReceiptEntity[]>();
  for (const receipt of input.receipts) {
    if (receipt.isDeleted || receipt.status !== 'expected' || !receipt.invoiceId) continue;
    const list = openReceiptsByInvoice.get(receipt.invoiceId) ?? [];
    list.push(receipt);
    openReceiptsByInvoice.set(receipt.invoiceId, list);
  }
  const paymentsByInvoice = new Map<string, PaymentEntity[]>();
  for (const payment of input.payments) {
    if (payment.isDeleted || payment.status !== 'received' || !payment.invoiceId) continue;
    const list = paymentsByInvoice.get(payment.invoiceId) ?? [];
    list.push(payment);
    paymentsByInvoice.set(payment.invoiceId, list);
  }

  const fromPayment = (payment: PaymentEntity, order: number): HistoryStep | null => {
    const date = dateOnly(payment.paidAt);
    const amount = roundMoney(Number(payment.amount) || 0);
    if (!date || amount <= 0) return null;
    return {
      date,
      amount,
      tdsAmount: roundMoney(Math.max(0, Number(payment.tdsAmount) || 0)),
      tdsSettles: Boolean(payment.tdsSettles),
      order,
    };
  };

  return input.cards.map((card) => {
    if (card.kind !== 'receipt') return card;
    const receipt = card.persistedId ? receiptById.get(card.persistedId) : undefined;
    const steps: HistoryStep[] = [];
    let createdOn = '';
    let originalAmount = 0;

    if (receipt) {
      createdOn = dateOnly(receipt.createdAt);
      originalAmount = roundMoney(Number(receipt.expectedAmount) || 0);
      parseReceivedLog(receipt.receivedLog).forEach((entry, index) => {
        steps.push({
          date: entry.date,
          amount: entry.amount,
          tdsAmount: entry.tdsAmount,
          tdsSettles: entry.tdsSettles,
          order: index,
          mode: entry.mode,
          receivedAccount: entry.account,
          receiptPaymentIndex: index,
        });
      });
      if (steps.length === 0 && receipt.invoiceId) {
        const open = openReceiptsByInvoice.get(receipt.invoiceId) ?? [];
        const sole = open.length === 1 && open[0]?.id === receipt.id;
        (paymentsByInvoice.get(receipt.invoiceId) ?? []).forEach((payment, index) => {
          const named = (payment.notes || '').includes(`Business Canvas receipt ${receipt.id}`);
          if (!named && !sole) return;
          const step = fromPayment(payment, index);
          if (step) steps.push(step);
        });
      }
    } else if (card.invoiceId && card.id.startsWith('sug-invoice-')) {
      const invoice = invoiceById.get(card.invoiceId);
      if (!invoice) return card;
      createdOn = dateOnly(invoice.createdAt);
      originalAmount = roundMoney(Number(invoice.total) || 0);
      (paymentsByInvoice.get(invoice.id) ?? []).forEach((payment, index) => {
        const step = fromPayment(payment, index);
        if (step) steps.push(step);
      });
    }

    if (steps.length === 0) return card;
    steps.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

    let left = originalAmount;
    const payments = steps.map((step) => {
      const settled = roundMoney(step.amount + (step.tdsSettles ? step.tdsAmount : 0));
      left = roundMoney(Math.max(0, left - settled));
      return {
        date: step.date,
        amount: step.amount,
        tdsAmount: step.tdsAmount,
        tdsSettles: step.tdsSettles,
        remainingAfter: left,
        mode: step.mode,
        receivedAccount: step.receivedAccount,
        receiptPaymentIndex: step.receiptPaymentIndex,
      };
    });
    const remaining = roundMoney(Math.max(0, Number(card.expectedAmount) || 0));
    // Skip when these payments do not explain the balance still on this card.
    if (Math.abs(left - remaining) > 0.5) return card;
    if (originalAmount <= 0) {
      originalAmount = roundMoney(
        remaining +
          payments.reduce(
            (sum, payment) =>
              sum + settledByEntry({
                date: payment.date,
                amount: payment.amount,
                account: 'gst',
                tdsAmount: payment.tdsAmount,
                tdsSettles: payment.tdsSettles,
                mode: '',
              }),
            0,
          ),
      );
    }
    const history: CanvasForecastHistory = {
      createdOn,
      originalAmount,
      payments,
      remaining,
    };
    return { ...card, history };
  });
};
