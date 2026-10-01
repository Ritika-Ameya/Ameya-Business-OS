import { customerRepository } from '../../customers';
import { dealComponentRepository, dealRepository } from '../../deals';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
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
      cards: snapshot.cards,
      accounts: snapshot.customers.map((customer) => ({
        id: customer.id,
        companyName:
          customer.companyName?.trim() || customer.contactPerson?.trim() || 'Untitled account',
        recordType: customer.recordType === 'opportunity' ? 'opportunity' : 'customer',
        temperature:
          customer.recordType === 'opportunity'
            ? temperatureByCustomer.get(customer.id) ?? ''
            : '',
      })),
      deals: snapshot.deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        customerId: deal.customerId,
        probability: Number(deal.probability || 0),
        contractValue: Number(deal.contractValue || 0),
        expectedCloseDate: deal.expectedCloseDate?.slice(0, 10) ?? '',
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
        ...(settled ? { status: 'received' as const } : { expectedAmount: remaining }),
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
    if (input.dealId) {
      const deal = await dealRepository.findById(input.dealId);
      if (!deal || deal.customerId !== input.customerId) {
        throw new ValidationError('That deal does not belong to this account.');
      }
    }

    return expectedReceiptRepository.create({
      origin: 'manual',
      sourceType: input.sourceType,
      sourceRefType: this.refType(input),
      sourceRefId: input.invoiceId || input.componentId || input.dealId || input.customerId,
      customerId: input.customerId,
      dealId: input.dealId ?? '',
      invoiceId: input.invoiceId ?? '',
      componentId: input.componentId ?? '',
      installmentIndex: 1,
      expectedAmount: roundMoney(input.expectedAmount),
      currency: 'INR',
      expectedDate: input.expectedDate,
      reason: input.reason.trim(),
      status: 'expected',
    } as Omit<ExpectedReceiptEntity, 'id'>);
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
    });
  }

  async dismiss(cardId: string): Promise<void> {
    const card = await this.requireCard(cardId);
    if (card.kind === 'account') return;
    if (card.origin === 'manual' && card.persistedId) {
      await expectedReceiptRepository.delete(card.persistedId);
      return;
    }
    if (card.persistedId) {
      await expectedReceiptRepository.update(card.persistedId, {
        origin: 'dismissed',
        status: 'cancelled',
      });
      return;
    }
    await this.persistCard(card, { status: 'cancelled' }, 'dismissed');
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
  }> {
    const today = toLocalDateOnly(new Date());
    const [customers, deals, components, invoices, receipts, temperatures] = await Promise.all([
      customerRepository.findAll(),
      dealRepository.findAll(),
      dealComponentRepository.findAll(),
      invoiceRepository.findAll(),
      expectedReceiptRepository.findAll(),
      leadTemperatureRepository.findAll(),
    ]);

    return {
      today,
      customers,
      deals,
      components,
      invoices,
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

  private refType(input: CreateReceiptInput): ReceiptSourceRefType {
    if (input.invoiceId) return 'invoice';
    if (input.componentId) return 'component';
    if (input.dealId) return 'deal';
    return 'customer';
  }

  private async persistCard(
    card: CanvasCard,
    patch: Partial<Pick<ExpectedReceiptEntity, 'expectedAmount' | 'expectedDate' | 'sourceType' | 'reason' | 'status'>>,
    origin: ExpectedReceiptEntity['origin'] = 'override',
  ): Promise<void> {
    if (card.persistedId && origin !== 'dismissed') {
      const next: Partial<ExpectedReceiptEntity> = {};
      if (patch.expectedAmount !== undefined) next.expectedAmount = patch.expectedAmount;
      if (patch.expectedDate !== undefined) next.expectedDate = patch.expectedDate;
      if (patch.sourceType !== undefined) next.sourceType = patch.sourceType;
      if (patch.reason !== undefined) next.reason = patch.reason;
      if (patch.status !== undefined) next.status = patch.status;
      await expectedReceiptRepository.update(card.persistedId, next);
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
      });
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
      currency: card.currency || 'INR',
      expectedDate: patch.expectedDate ?? card.expectedDate,
      reason: patch.reason ?? card.reason,
      status: origin === 'dismissed' ? 'cancelled' : patch.status ?? 'expected',
    } as Omit<ExpectedReceiptEntity, 'id'>);
  }
}

export const canvasService = new CanvasService();
