import { customerRepository } from '../../customers';
import { dealComponentRepository, dealRepository } from '../../deals';
import { computeComponentLineTotal } from '../../deals/utils/componentAmount.util';
import {
  alignComponentDueDatePatch,
  getComponentCurrentDueDate,
  hasRenewalFrequency,
} from '../../deals/utils/renewalHelpers.util';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import {
  formatReceivedLog,
  parseReceivedLog,
  settledByEntry,
  settledFromLog,
} from '../utils/receivedLog.util';
import { invoiceRepository, invoiceService, paymentRepository } from '../../revenue';
import {
  effectiveInvoiceOutstanding,
  isCollectionInvoice,
} from '../../revenue/utils/invoiceCalculation.util';
import { BaseService } from '../../../services/base.service';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import { toLocalDateOnly } from '../../analytics/utils/dateRange.util';
import type {
  CanvasBoardPayload,
  CanvasCard,
  ExpectedReceiptEntity,
  LeadTemperatureValue,
  ReceiptSourceRefType,
} from '../types/canvas.entities';
import type {
  CreateReceiptInput,
  MarkReceiptPaidInput,
  SplitReceiptInput,
  UpdateReceiptInput,
} from '../validators/canvas.validators';
import {
  buildCanvasCards,
  buildPaidEntries,
  buildRenewalReminders,
  withForecastHistory,
  componentIdMatchingDealTotal,
  shiftDateToMonth,
} from '../utils/canvasBoard.util';
import { expectedReceiptRepository, leadTemperatureRepository } from './canvas.repository';

const PAYMENT_TOLERANCE = 0.009;

const DRAG_HINT =
  'Drag a card left or right to change Hot, Warm, or Cold. Drag it between months to change the expected month. Dropping on Customers does not convert an opportunity.';

export class CanvasService extends BaseService {
  /** Mark-paid runs one at a time so two clicks cannot both pass the balance check. */
  private markPaidQueue: Promise<unknown> = Promise.resolve();

  constructor() {
    super('CanvasService');
  }

  async getBoard(): Promise<CanvasBoardPayload> {
    const [snapshot, payments] = await Promise.all([
      this.loadSnapshot(),
      paymentRepository.findAll(),
    ]);
    const temperatureByCustomer = new Map(
      snapshot.cards
        .filter((card) => card.recordType === 'opportunity' && card.temperature)
        .map((card) => [card.customerId, card.temperature]),
    );

    return {
      today: snapshot.today,
      dragHint: DRAG_HINT,
      cards: withForecastHistory({
        cards: snapshot.cards,
        receipts: snapshot.receipts,
        invoices: snapshot.invoices,
        payments,
      }),
      accounts: snapshot.customers.map((customer) => ({
        id: customer.id,
        companyName:
          customer.companyName?.trim() || customer.contactPerson?.trim() || 'Untitled account',
        recordType: customer.recordType === 'opportunity' ? 'opportunity' : 'customer',
        temperature:
          customer.recordType === 'opportunity'
            ? temperatureByCustomer.get(customer.id) ?? ''
            : '',
        internationalClient: Boolean(customer.internationalClient),
      })),
      deals: snapshot.deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        customerId: deal.customerId,
        probability: Number(deal.probability || 0),
        contractValue: Number(deal.contractValue || 0),
        expectedCloseDate: deal.expectedCloseDate?.slice(0, 10) ?? '',
        components: snapshot.components
          .filter((component) => component.dealId === deal.id)
          .map((component) => ({
            id: component.id,
            name: component.name?.trim() || 'Component',
            total: computeComponentLineTotal(component),
            gstPercent: Number(component.gstPercent) || 0,
          })),
      })),
      renewals: buildRenewalReminders({
        customers: snapshot.customers,
        deals: snapshot.deals,
        components: snapshot.components,
        invoices: snapshot.invoices,
        today: snapshot.today,
      }),
      paid: buildPaidEntries({
        customers: snapshot.customers,
        invoices: snapshot.invoices,
        payments,
        receipts: snapshot.receipts,
      }),
    };
  }

  async getTemperature(customerId: string): Promise<LeadTemperatureValue | ''> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError('Account not found');
    const row = (await leadTemperatureRepository.findAll()).find(
      (item) => item.customerId === customerId,
    );
    return customer.recordType === 'opportunity' ? row?.temperature ?? '' : '';
  }

  markPaid(input: MarkReceiptPaidInput): Promise<void> {
    const run = this.markPaidQueue.then(() => this.markPaidNow(input));
    this.markPaidQueue = run.catch(() => undefined);
    return run;
  }

  private async markPaidNow(input: MarkReceiptPaidInput): Promise<void> {
    const snapshot = await this.loadSnapshot();
    const card = snapshot.cards.find((item) => item.id === input.cardId);
    if (!card || card.kind !== 'receipt') {
      throw new ValidationError('This expected receipt is no longer open. It may already be paid.');
    }
    if (card.status === 'received') {
      throw new ValidationError('This expected receipt is already marked paid.');
    }
    if (card.status === 'cancelled' || card.status === 'superseded') {
      throw new ValidationError('A cancelled expected receipt cannot be marked paid.');
    }

    if (!input.invoiceId) {
      await this.recordForecastPayment(card, input);
      return;
    }

    const invoice = snapshot.invoices.find((item) => item.id === input.invoiceId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.customerId !== card.customerId) {
      throw new ValidationError('That invoice belongs to a different account.');
    }
    if (card.invoiceId && card.invoiceId !== invoice.id) {
      throw new ValidationError(
        `This expected receipt is linked to invoice ${card.invoiceNumber || card.invoiceId}. Record the payment against that invoice.`,
      );
    }
    if (!isCollectionInvoice(invoice) || effectiveInvoiceOutstanding(invoice) <= 0) {
      throw new ValidationError('That invoice has no outstanding balance to pay.');
    }

    const stored = card.persistedId
      ? await expectedReceiptRepository.findById(card.persistedId)
      : null;
    if (card.persistedId && (!stored || stored.status !== 'expected')) {
      throw new ValidationError('This expected receipt is already marked paid.');
    }

    // Ties the payment to this exact receipt state so a retry after a partial
    // failure reuses the payment instead of recording it twice.
    const marker = stored
      ? `Business Canvas receipt ${stored.id} v${stored.version}`
      : card.componentId
        ? `Business Canvas renewal ${card.componentId} due ${card.expectedDate}`
        : '';
    const alreadyRecorded = marker
      ? (await paymentRepository.findAll()).find(
          (payment) => payment.invoiceId === invoice.id && payment.notes.includes(marker),
        )
      : undefined;

    const paidAmount = alreadyRecorded
      ? roundMoney(Number(alreadyRecorded.amount) || 0)
      : roundMoney(input.amount);
    const removeGstReason = (input.removeGstReason ?? '').trim();
    const gstRemoved =
      !alreadyRecorded && Boolean(removeGstReason) && invoice.billingType === 'gst';
    if (!alreadyRecorded) {
      await invoiceService.addPayment(invoice.id, {
        paymentDate: input.paymentDate,
        amount: paidAmount,
        mode: input.mode,
        referenceNumber: input.referenceNumber,
        receivedBy: '',
        transactionId: '',
        notes: [input.notes, marker].filter(Boolean).join(' · '),
        status: 'received',
        currency: invoice.currency || 'INR',
        removeGstReason: gstRemoved ? removeGstReason : undefined,
        receivedAccount: input.receivedAccount,
        tdsAmount: roundMoney(Math.max(0, Number(input.tdsAmount) || 0)),
        tdsSettles: Boolean(input.tdsSettles),
      });
    }

    const statedExpected = roundMoney(Number(card.expectedAmount) || 0);
    const invoiceTotal = Number(invoice.total) || 0;
    const expected =
      gstRemoved && invoiceTotal > 0
        ? roundMoney((statedExpected * Number(invoice.subtotal || 0)) / invoiceTotal)
        : statedExpected;
    const remaining = roundMoney(expected - paidAmount);
    const settled = remaining <= PAYMENT_TOLERANCE;
    const link = {
      invoiceId: invoice.id,
      sourceRefType: 'invoice' as const,
      sourceRefId: invoice.id,
      dealId: card.dealId || invoice.dealId,
    };

    if (stored) {
      await expectedReceiptRepository.update(stored.id, {
        ...link,
        ...(settled ? { status: 'received' as const } : {}),
      });
      return;
    }

    if (card.componentId) {
      await expectedReceiptRepository.create({
        origin: 'override',
        sourceType: card.sourceType || 'renewal',
        ...link,
        customerId: card.customerId,
        componentId: card.componentId,
        installmentIndex: card.installmentIndex || 1,
        expectedAmount: settled ? expected : remaining,
        gstPercent: card.gstPercent,
        currency: card.currency || invoice.currency || 'INR',
        expectedDate: card.expectedDate,
        reason: card.reason,
        status: settled ? 'received' : 'expected',
      } as Omit<ExpectedReceiptEntity, 'id'>);
    }
    // An invoice-balance suggestion needs no row: the invoice's own balance drives it.
  }

  async setTemperature(customerId: string, temperature: LeadTemperatureValue | ''): Promise<void> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError('Account not found');
    if (customer.recordType !== 'opportunity') {
      throw new ValidationError(
        'Hot, Warm, and Cold apply to opportunities. Customers stay in the Customer row.',
      );
    }

    const existing = (await leadTemperatureRepository.findAll()).find(
      (row) => row.customerId === customerId,
    );

    if (!temperature) {
      if (existing) await leadTemperatureRepository.delete(existing.id);
      return;
    }

    if (existing) {
      await leadTemperatureRepository.update(existing.id, { temperature });
      return;
    }

    await leadTemperatureRepository.create({
      customerId,
      temperature,
    } as Omit<import('../types/canvas.entities').LeadTemperatureEntity, 'id'>);
  }

  async schedule(cardId: string, monthKey: string): Promise<void> {
    const card = await this.requireCard(cardId);
    if (card.kind !== 'receipt') {
      throw new ValidationError('Choose an expected receipt to move between months.');
    }
    if (card.status === 'received' || card.status === 'cancelled') {
      throw new ValidationError('Received and cancelled receipts stay in the month they were recorded.');
    }
    const expectedDate = shiftDateToMonth(card.expectedDate, monthKey);
    await this.persistCard(card, { expectedDate });
  }

  async createReceipt(input: CreateReceiptInput): Promise<ExpectedReceiptEntity> {
    const customer = await customerRepository.findById(input.customerId);
    if (!customer) throw new NotFoundError('Account not found');
    const dealComponents = input.dealId
      ? (await dealComponentRepository.findAll()).filter((component) => component.dealId === input.dealId)
      : [];
    if (input.dealId) {
      const deal = await dealRepository.findById(input.dealId);
      if (!deal || deal.customerId !== input.customerId) {
        throw new ValidationError('That deal does not belong to this account.');
      }
    }
    const componentId = this.componentForNewReceipt(input, dealComponents);
    const dueSync = input.componentId
      ? await this.planComponentDueSync(
          {
            componentId,
            invoiceId: input.invoiceId ?? '',
            sourceType: input.sourceType,
            status: 'expected',
          },
          input.expectedDate,
        )
      : null;

    const created = await expectedReceiptRepository.create({
      origin: 'manual',
      sourceType: input.sourceType,
      sourceRefType: componentId ? 'component' : this.refType(input),
      sourceRefId: input.invoiceId || componentId || input.dealId || input.customerId,
      customerId: input.customerId,
      dealId: input.dealId ?? '',
      invoiceId: input.invoiceId ?? '',
      componentId,
      installmentIndex: 1,
      expectedAmount: roundMoney(input.expectedAmount),
      gstPercent: input.gstPercent ?? null,
      currency: 'INR',
      expectedDate: input.expectedDate,
      reason: input.reason.trim(),
      status: 'expected',
    } as Omit<ExpectedReceiptEntity, 'id'>);
    if (dueSync) await dealComponentRepository.update(dueSync.id, dueSync.patch);
    return created;
  }

  async updateReceipt(input: UpdateReceiptInput): Promise<void> {
    const card = await this.requireCard(input.cardId);
    if (card.kind !== 'receipt') {
      throw new ValidationError('Add an expected receipt before editing an amount or date.');
    }
    await this.persistCard(card, {
      expectedAmount:
        input.expectedAmount !== undefined ? roundMoney(input.expectedAmount) : undefined,
      expectedDate: input.expectedDate,
      sourceType: input.sourceType,
      reason: input.reason?.trim(),
      status: input.status,
      gstPercent: input.gstPercent,
    });
  }

  /** Hand-entered forecasts for this deal that are not already an invoice. */
  async listDealForecasts(dealId: string): Promise<
    Array<{
      id: string;
      reason: string;
      expectedAmount: number;
      expectedDate: string;
      sourceType: ExpectedReceiptEntity['sourceType'];
    }>
  > {
    const deal = await dealRepository.findById(dealId);
    const customerId = deal?.customerId ?? '';
    const receipts = await expectedReceiptRepository.findAll();
    return receipts
      .filter((receipt) => {
        if (
          receipt.origin !== 'manual' ||
          receipt.status !== 'expected' ||
          receipt.invoiceId ||
          receipt.sourceType !== 'deal_expected'
        ) {
          return false;
        }
        if (receipt.dealId === dealId) return true;
        return (
          Boolean(customerId) &&
          receipt.customerId === customerId &&
          !receipt.dealId &&
          receipt.sourceType === 'deal_expected'
        );
      })
      .map((receipt) => ({
        id: receipt.id,
        reason: receipt.reason,
        expectedAmount: roundMoney(receipt.expectedAmount),
        expectedDate: receipt.expectedDate?.slice(0, 10) ?? '',
        sourceType: receipt.sourceType,
      }));
  }

  async dismiss(cardId: string): Promise<void> {
    const card = await this.requireCard(cardId);
    if (card.kind !== 'receipt') return;
    if (card.status === 'received') {
      throw new ValidationError('Money already received stays on the canvas as Received.');
    }
    const hideInvoice = Boolean(card.invoiceId);
    if (card.persistedId) {
      await expectedReceiptRepository.update(card.persistedId, {
        origin: 'dismissed',
        status: 'cancelled',
        ...(hideInvoice ? { suppressInvoice: true } : {}),
      });
      return;
    }
    await this.persistCard(card, { status: 'cancelled' }, 'dismissed');
    if (hideInvoice) {
      const created = (await expectedReceiptRepository.findAll()).find(
        (receipt) =>
          receipt.origin === 'dismissed' &&
          receipt.status === 'cancelled' &&
          receipt.invoiceId === card.invoiceId &&
          !receipt.suppressInvoice,
      );
      if (created) {
        await expectedReceiptRepository.update(created.id, { suppressInvoice: true });
      }
    }
  }

  /** Cash marked on a forecast, with no invoice. Shown on the customer's payment tab. */
  async listCustomerReceiptPayments(customerId: string): Promise<
    Array<{
      receiptId: string;
      index: number;
      customerId: string;
      dealId: string;
      dealTitle: string;
      componentId: string;
      reason: string;
      paymentDate: string;
      amount: number;
      mode: string;
      tdsAmount: number;
      tdsSettles: boolean;
      status: 'received';
    }>
  > {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError('Account not found');
    const [receipts, deals] = await Promise.all([
      expectedReceiptRepository.findAll(),
      dealRepository.findAll(),
    ]);
    const dealTitle = new Map(deals.map((deal) => [deal.id, deal.title]));
    const rows: Array<{
      receiptId: string;
      index: number;
      customerId: string;
      dealId: string;
      dealTitle: string;
      componentId: string;
      reason: string;
      paymentDate: string;
      amount: number;
      mode: string;
      tdsAmount: number;
      tdsSettles: boolean;
      status: 'received';
    }> = [];
    for (const receipt of receipts) {
      if (receipt.isDeleted || receipt.customerId !== customerId || receipt.invoiceId) continue;
      parseReceivedLog(receipt.receivedLog).forEach((entry, index) => {
        rows.push({
          receiptId: receipt.id,
          index,
          customerId,
          dealId: receipt.dealId || '',
          dealTitle: dealTitle.get(receipt.dealId) || '',
          componentId: receipt.componentId || '',
          reason: receipt.reason || '',
          paymentDate: entry.date,
          amount: entry.amount,
          mode: entry.mode,
          tdsAmount: entry.tdsAmount,
          tdsSettles: entry.tdsSettles,
          status: 'received',
        });
      });
    }
    rows.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.index - a.index);
    return rows;
  }

  /**
   * Removes one cash line recorded on a forecast. The receipt row stays.
   * A fully received forecast opens again for whatever cash is no longer recorded.
   */
  async removeReceiptPayment(receiptId: string, index: number): Promise<void> {
    const receipt = await expectedReceiptRepository.findById(receiptId);
    if (!receipt || receipt.isDeleted) throw new NotFoundError('Expected receipt not found');
    const entries = parseReceivedLog(receipt.receivedLog);
    if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
      throw new NotFoundError('Payment not found');
    }
    const nextEntries = entries.filter((_, entryIndex) => entryIndex !== index);
    const settled = roundMoney(nextEntries.reduce((sum, entry) => sum + settledByEntry(entry), 0));
    const expected = roundMoney(Number(receipt.expectedAmount) || 0);
    const reopen = receipt.status === 'received' && settled < expected - 0.001;
    await expectedReceiptRepository.update(receiptId, {
      receivedLog: formatReceivedLog(nextEntries),
      ...(reopen ? { status: 'expected' as const } : {}),
    });
  }

  /** Records cash against the forecast itself. The original expected amount is kept. */
  private async recordForecastPayment(
    card: CanvasCard,
    input: MarkReceiptPaidInput,
  ): Promise<void> {
    const tdsAmount = roundMoney(Math.max(0, Number(input.tdsAmount) || 0));
    const tdsSettles = Boolean(input.tdsSettles) && tdsAmount > 0;
    const account = input.receivedAccount === 'other' ? 'other' : 'gst';
    let stored = card.persistedId
      ? await expectedReceiptRepository.findById(card.persistedId)
      : null;
    if (!stored) {
      await this.persistCard(card, {}, 'override');
      stored = (await expectedReceiptRepository.findAll()).find(
        (receipt) =>
          receipt.status === 'expected' &&
          receipt.customerId === card.customerId &&
          receipt.expectedDate.slice(0, 10) === card.expectedDate &&
          roundMoney(receipt.expectedAmount) === roundMoney(card.expectedAmount ?? 0),
      ) ?? null;
    }
    if (!stored) {
      throw new ValidationError('This forecast could not be saved before recording the payment.');
    }
    const already = settledFromLog(stored.receivedLog);
    const expected = roundMoney(Number(stored.expectedAmount) || 0);
    const open = roundMoney(Math.max(0, expected - already));
    const settling = roundMoney(input.amount + (tdsSettles ? tdsAmount : 0));
    if (settling > open + 0.001) {
      throw new ValidationError(
        `Amount cannot be more than the ${open} still expected on this forecast.`,
      );
    }
    const nextLog = formatReceivedLog([
      ...parseReceivedLog(stored.receivedLog),
      {
        date: input.paymentDate,
        amount: roundMoney(input.amount),
        account,
        tdsAmount,
        tdsSettles,
        mode: input.mode.trim(),
      },
    ]);
    const fullyReceived = roundMoney(already + settling) >= expected - 0.001;
    await expectedReceiptRepository.update(stored.id, {
      receivedLog: nextLog,
      ...(fullyReceived ? { status: 'received' as const } : {}),
    });
  }

  async splitInvoice(input: SplitReceiptInput): Promise<void> {
    const invoice = await invoiceRepository.findById(input.invoiceId);
    if (!invoice) throw new NotFoundError('Invoice not found');

    const existing = (await expectedReceiptRepository.findAll()).filter(
      (receipt) => receipt.invoiceId === input.invoiceId && receipt.status === 'expected',
    );
    for (const receipt of existing) {
      await expectedReceiptRepository.update(receipt.id, { status: 'superseded' });
    }

    let index = 1;
    for (const part of input.parts) {
      await expectedReceiptRepository.create({
        origin: 'installment',
        sourceType: 'invoice_installment',
        sourceRefType: 'invoice',
        sourceRefId: invoice.id,
        customerId: invoice.customerId,
        dealId: invoice.dealId,
        invoiceId: invoice.id,
        componentId: '',
        installmentIndex: index,
        expectedAmount: roundMoney(part.expectedAmount),
        gstPercent: null,
        currency: invoice.currency || 'INR',
        expectedDate: part.expectedDate,
        reason: part.reason?.trim() || `Installment ${index} · ${invoice.invoiceNumber}`,
        status: 'expected',
      } as Omit<ExpectedReceiptEntity, 'id'>);
      index += 1;
    }
  }

  private async loadSnapshot(): Promise<{
    today: string;
    cards: CanvasCard[];
    customers: Awaited<ReturnType<typeof customerRepository.findAll>>;
    deals: Awaited<ReturnType<typeof dealRepository.findAll>>;
    components: Awaited<ReturnType<typeof dealComponentRepository.findAll>>;
    invoices: Awaited<ReturnType<typeof invoiceRepository.findAll>>;
    receipts: ExpectedReceiptEntity[];
  }> {
    const today = toLocalDateOnly(new Date());
    const [customers, deals, components, invoices, loadedReceipts, loadedTemperatures] =
      await Promise.all([
        customerRepository.findAll(),
        dealRepository.findAll(),
        dealComponentRepository.findAll(),
        invoiceRepository.findAll(),
        expectedReceiptRepository.findAll(),
        leadTemperatureRepository.findAll(),
      ]);

    const liveCustomerIds = new Set(customers.map((customer) => customer.id));
    const staleReceipts = loadedReceipts.filter(
      (receipt) => receipt.customerId !== '' && !liveCustomerIds.has(receipt.customerId),
    );
    const staleTemperatures = loadedTemperatures.filter(
      (row) => row.customerId !== '' && !liveCustomerIds.has(row.customerId),
    );
    if (staleReceipts.length > 0 || staleTemperatures.length > 0) {
      for (const receipt of staleReceipts) {
        await expectedReceiptRepository.delete(receipt.id);
      }
      for (const row of staleTemperatures) {
        await leadTemperatureRepository.delete(row.id);
      }
      this.logInfo(
        `Removed ${staleReceipts.length} canvas receipt(s) and ${staleTemperatures.length} temperature row(s) left behind by deleted customers`,
      );
    }
    const receipts = loadedReceipts.filter((receipt) => !staleReceipts.includes(receipt));
    const temperatures = loadedTemperatures.filter((row) => !staleTemperatures.includes(row));

    return {
      today,
      customers,
      deals,
      components,
      invoices,
      receipts,
      cards: buildCanvasCards({
        customers,
        deals,
        components,
        invoices,
        receipts,
        temperatures,
        today,
      }),
    };
  }

  private async requireCard(cardId: string): Promise<CanvasCard> {
    const snapshot = await this.loadSnapshot();
    const card = snapshot.cards.find((item) => item.id === cardId);
    if (!card) throw new NotFoundError('Expected receipt not found');
    return card;
  }

  private componentForNewReceipt(
    input: CreateReceiptInput,
    components: Awaited<ReturnType<typeof dealComponentRepository.findAll>>,
  ): string {
    if (input.componentId) {
      const chosen = components.find((component) => component.id === input.componentId);
      if (!chosen) {
        throw new ValidationError('That component does not belong to the selected deal.');
      }
      return chosen.id;
    }
    return componentIdMatchingDealTotal(input.dealId, input.expectedAmount, components);
  }

  private refType(input: CreateReceiptInput): ReceiptSourceRefType {
    if (input.invoiceId) return 'invoice';
    if (input.componentId) return 'component';
    if (input.dealId) return 'deal';
    return 'customer';
  }

  /**
   * A component-linked expected receipt (not an invoice installment) is the same
   * cycle the deal shows. Changing its date moves only the unpaid due date.
   */
  private shouldSyncComponentDue(card: {
    componentId: string;
    invoiceId: string;
    sourceType: string;
    status: string;
  }): boolean {
    if (!card.componentId || card.invoiceId) return false;
    if (card.sourceType === 'invoice_balance' || card.sourceType === 'invoice_installment') {
      return false;
    }
    if (card.status === 'received' || card.status === 'cancelled' || card.status === 'superseded') {
      return false;
    }
    return true;
  }

  private async planComponentDueSync(
    card: {
      componentId: string;
      invoiceId: string;
      sourceType: string;
      status: string;
    },
    expectedDate: string | undefined,
  ): Promise<{ id: string; patch: { renewalDate: string; renewalStartDate?: string } } | null> {
    if (!expectedDate || !this.shouldSyncComponentDue(card)) return null;
    const component = await dealComponentRepository.findById(card.componentId);
    if (!component) return null;
    const hasDate = Boolean((component.renewalStartDate || component.renewalDate || '').trim());
    if (!hasRenewalFrequency(component.renewalFrequency) && !hasDate) return null;
    const next = expectedDate.slice(0, 10);
    const current = getComponentCurrentDueDate(component).slice(0, 10);
    if (current === next) return null;
    const patch = alignComponentDueDatePatch(component, next);
    if (!patch) {
      throw new ValidationError(
        `That date is on or before the last paid cycle (${(component.lastRenewedDate || '').slice(0, 10)}). The renewal cycle was not changed.`,
      );
    }
    return { id: component.id, patch };
  }

  private async persistCard(
    card: CanvasCard,
    patch: Partial<
      Pick<
        ExpectedReceiptEntity,
        'expectedAmount' | 'expectedDate' | 'sourceType' | 'reason' | 'status' | 'gstPercent'
      >
    >,
    origin: ExpectedReceiptEntity['origin'] = 'override',
  ): Promise<void> {
    const dueSync =
      origin === 'dismissed' || patch.status === 'cancelled'
        ? null
        : await this.planComponentDueSync(card, patch.expectedDate);
    const commitDue = async () => {
      if (dueSync) await dealComponentRepository.update(dueSync.id, dueSync.patch);
    };

    if (card.persistedId && origin !== 'dismissed') {
      const next: Partial<ExpectedReceiptEntity> = {};
      if (patch.expectedAmount !== undefined) next.expectedAmount = patch.expectedAmount;
      if (patch.expectedDate !== undefined) next.expectedDate = patch.expectedDate;
      if (patch.sourceType !== undefined) next.sourceType = patch.sourceType;
      if (patch.reason !== undefined) next.reason = patch.reason;
      if (patch.status !== undefined) next.status = patch.status;
      if (patch.gstPercent !== undefined) next.gstPercent = patch.gstPercent;
      await expectedReceiptRepository.update(card.persistedId, next);
      await commitDue();
      return;
    }

    const existingMatch = (await expectedReceiptRepository.findAll()).find((receipt) => {
      if (receipt.status !== 'expected' || receipt.origin === 'dismissed') return false;
      if (
        card.invoiceId &&
        receipt.invoiceId === card.invoiceId &&
        card.installmentIndex === receipt.installmentIndex
      ) {
        return true;
      }
      return Boolean(card.componentId) && receipt.componentId === card.componentId;
    });
    if (existingMatch) {
      const sourceType = patch.sourceType || card.sourceType || existingMatch.sourceType;
      await expectedReceiptRepository.update(existingMatch.id, {
        expectedAmount: roundMoney(
          patch.expectedAmount ?? card.expectedAmount ?? existingMatch.expectedAmount,
        ),
        expectedDate: patch.expectedDate ?? card.expectedDate,
        sourceType,
        reason: patch.reason ?? card.reason,
        status: patch.status ?? existingMatch.status,
        origin: origin === 'dismissed' ? 'dismissed' : existingMatch.origin,
        ...(patch.gstPercent !== undefined ? { gstPercent: patch.gstPercent } : {}),
      });
      await commitDue();
      return;
    }

    const sourceRefType: ReceiptSourceRefType = card.invoiceId
      ? 'invoice'
      : card.componentId
        ? 'component'
        : card.dealId
          ? 'deal'
          : 'customer';

    await expectedReceiptRepository.create({
      origin,
      sourceType: patch.sourceType || card.sourceType || 'other',
      sourceRefType,
      sourceRefId: card.invoiceId || card.componentId || card.dealId || card.customerId,
      customerId: card.customerId,
      dealId: card.dealId,
      invoiceId: card.invoiceId,
      componentId: card.componentId,
      installmentIndex: card.installmentIndex || 1,
      expectedAmount: roundMoney(patch.expectedAmount ?? card.expectedAmount ?? 0),
      gstPercent: patch.gstPercent !== undefined ? patch.gstPercent : card.gstPercent,
      currency: card.currency || 'INR',
      expectedDate: patch.expectedDate ?? card.expectedDate,
      reason: patch.reason ?? card.reason,
      status: origin === 'dismissed' ? 'cancelled' : patch.status ?? 'expected',
    } as Omit<ExpectedReceiptEntity, 'id'>);
    await commitDue();
  }
}

export const canvasService = new CanvasService();
