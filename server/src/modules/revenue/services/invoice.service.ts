import type { PaginatedResult, QueryOptions } from '../../../types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../../constants';
import { BaseService } from '../../../services/base.service';
import {
  deleteDriveFileQuietly,
  deriveFileType,
  uploadDocumentToDrive,
} from '../../../services/documentUpload.service';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import { assertForeignKeys } from '../../../utils/foreignKey.util';
import { assertUniqueField } from '../../../utils/uniqueness.util';
import { applyFilters } from '../../../utils/filtering.util';
import { applySort } from '../../../utils/sorting.util';
import { paginateArray } from '../../../utils/pagination.util';
import { invoiceRepository, paymentRepository } from './revenue.repository';
import { customerRepository, documentRepository } from '../../customers';
import type { DocumentEntity } from '../../customers';
import { dealRepository, dealComponentRepository } from '../../deals';
import { computeComponentTaxable } from '../../deals/utils/componentAmount.util';
import type {
  InvoiceBillingType,
  InvoiceEntity,
  InvoiceLineItem,
  PaymentEntity,
} from '../types/revenue.entities';
import type {
  InvoiceCancelInput,
  InvoiceCreateInput,
  InvoiceDocumentCreateInput,
  InvoiceUpdateInput,
  PaymentCreateInput,
  PaymentUpdateInput,
} from '../validators/revenue.validators';
import {
  applyInvoiceSearch,
  parseSearchFields,
  parseSearchMode,
} from '../utils/invoiceSearch.util';
import {
  applyBalance,
  buildLineItem,
  computeTaxAmount,
  lineItemsMatchSubtotal,
  normalizeInvoiceStatus,
  repriceLineItems,
  resolveBillingType,
  resolveCreateAmounts,
  resolveUpdateAmounts,
  roundMoney,
  sumCollectionOutstandingForCustomer,
  totalsFromLineItems,
} from '../utils/invoiceCalculation.util';
import { createInvoiceTimelineEntry, prependInvoiceTimeline } from '../utils/timeline.util';
import { toISOString } from '../../../utils/date.util';
import { tryAdvanceComponentRenewal } from '../../deals/utils/renewalHelpers.util';

const DOCUMENT_ENTITY_TYPE = 'invoice';
const DEFAULT_GST_PERCENT = 18;

export class InvoiceService extends BaseService {
  constructor() {
    super('InvoiceService');
  }

  async list(
    options?: QueryOptions,
    search?: { q?: string; mode?: string; fields?: string },
  ): Promise<PaginatedResult<InvoiceEntity>> {
    let items = await invoiceRepository.findAll(options);
    items = applyInvoiceSearch(
      items,
      search?.q,
      parseSearchMode(search?.mode),
      parseSearchFields(search?.fields),
    );
    if (options?.filters?.length) {
      items = applyFilters(items as Record<string, unknown>[], options.filters) as InvoiceEntity[];
    }
    if (options?.sort) {
      items = applySort(items as Record<string, unknown>[], options.sort) as InvoiceEntity[];
    }
    const pagination = options?.pagination ?? {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };
    return paginateArray(items, pagination);
  }

  async getById(id: string): Promise<InvoiceEntity> {
    const entity = await invoiceRepository.findById(id);
    if (!entity) throw new NotFoundError('Invoice not found');
    return entity;
  }

  async create(input: InvoiceCreateInput): Promise<InvoiceEntity> {
    this.logInfo('Creating invoice');
    await this.validateInvoiceRefs(input);

    const customer = await customerRepository.findById(input.customerId);
    const deal = await dealRepository.findById(input.dealId);
    if (!customer) throw new ValidationError('Customer not found');
    if (!deal) throw new ValidationError('Deal not found');
    if (deal.customerId !== customer.id) {
      throw new ValidationError('Deal does not belong to the selected customer');
    }

    const billingType = resolveBillingType(input.billingType, input.taxPercent);
    const isNonGst = billingType === 'non_gst';
    const fromComponents = await this.amountsFromSelectedComponents(
      input.componentIds,
      input.taxPercent,
      billingType,
    );
    const { subtotal, taxPercent, tax, total, lineItems } = fromComponents ?? {
      ...resolveCreateAmounts({
        subtotal: input.subtotal,
        taxPercent: isNonGst ? 0 : input.taxPercent,
        tax: isNonGst ? 0 : input.tax,
        total: isNonGst ? undefined : input.total,
      }),
      lineItems: [],
    };

    const invoiceNumber = input.invoiceNumber.trim();
    if (!invoiceNumber) {
      throw new ValidationError('Invoice number is required');
    }

    await this.assertUniqueInvoiceNumber(invoiceNumber);

    const timeline = [
      createInvoiceTimelineEntry({
        action: 'created',
        notes: input.notes || undefined,
      }),
    ];

    const created = await invoiceRepository.create({
      invoiceNumber,
      customerId: customer.id,
      customerName: input.customerName.trim() || customer.contactPerson || customer.companyName,
      dealId: deal.id,
      dealTitle: input.dealTitle.trim() || deal.title,
      status: normalizeInvoiceStatus(input.status),
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      subtotal,
      taxPercent,
      tax,
      total,
      currency: input.currency.trim() || 'INR',
      received: 0,
      outstanding: total,
      componentIds: input.componentIds,
      notes: input.notes.trim(),
      timeline,
      cancelledReason: '',
      cancelledAt: '',
      cancelledBy: '',
      nextActionDate: (input.nextActionDate ?? '').trim(),
      billingType,
      lineItems,
    } as Omit<InvoiceEntity, 'id'>);

    await this.syncCustomerOutstanding(created.customerId);
    return created;
  }

  async update(id: string, input: InvoiceUpdateInput): Promise<InvoiceEntity> {
    const existing = await this.getById(id);
    if (input.customerId || input.dealId) {
      await this.validateInvoiceRefs({
        customerId: input.customerId ?? existing.customerId,
        dealId: input.dealId ?? existing.dealId,
      });
    }

    if (input.invoiceNumber && input.invoiceNumber.trim() !== existing.invoiceNumber) {
      await this.assertUniqueInvoiceNumber(input.invoiceNumber.trim(), id);
    }

    const billingType = input.billingType ?? existing.billingType;
    const billingChanged = billingType !== existing.billingType;
    const billingChangeReason = (input.billingChangeReason ?? '').trim();
    if (billingChanged && normalizeInvoiceStatus(existing.status) === 'cancelled') {
      throw new ValidationError('Cancelled invoices cannot change GST');
    }
    if (billingChanged && !billingChangeReason) {
      throw new ValidationError('Give a reason for changing GST on this invoice');
    }

    const { subtotal, taxPercent, tax, total, lineItems } = await this.resolveUpdatedAmounts(
      existing,
      input,
      billingType,
    );

    const totalChanged = roundMoney(total) !== roundMoney(existing.total);
    const payments = totalChanged ? await this.listPaymentsForInvoice(id) : [];
    const balance = totalChanged ? applyBalance({ ...existing, total }, payments) : null;
    if (balance && total < balance.received - 0.001) {
      throw new ValidationError('Invoice total cannot be less than the amount already received', [
        `Received so far is ${roundMoney(balance.received)}`,
      ]);
    }

    let timeline = prependInvoiceTimeline(
      existing.timeline,
      createInvoiceTimelineEntry({ action: 'updated' }),
    );
    if (billingChanged) {
      timeline = prependInvoiceTimeline(
        timeline,
        createInvoiceTimelineEntry({
          action: billingType === 'non_gst' ? 'gst_removed' : 'gst_added',
          notes: billingChangeReason,
        }),
      );
    }

    const patch: Partial<InvoiceEntity> = { timeline, billingType, lineItems };
    if (input.invoiceNumber !== undefined) patch.invoiceNumber = input.invoiceNumber.trim();
    if (input.customerId !== undefined) patch.customerId = input.customerId;
    if (input.customerName !== undefined) patch.customerName = input.customerName.trim();
    if (input.dealId !== undefined) patch.dealId = input.dealId;
    if (input.dealTitle !== undefined) patch.dealTitle = input.dealTitle.trim();
    if (input.issueDate !== undefined) patch.issueDate = input.issueDate;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
    if (input.currency !== undefined) patch.currency = input.currency.trim();
    if (input.componentIds !== undefined) patch.componentIds = input.componentIds;
    if (input.notes !== undefined) patch.notes = input.notes.trim();
    if (input.nextActionDate !== undefined) patch.nextActionDate = input.nextActionDate;
    if (roundMoney(subtotal) !== roundMoney(existing.subtotal)) patch.subtotal = subtotal;
    if (roundMoney(taxPercent) !== roundMoney(existing.taxPercent)) patch.taxPercent = taxPercent;
    if (roundMoney(tax) !== roundMoney(existing.tax)) patch.tax = tax;
    if (totalChanged && balance) {
      patch.total = total;
      patch.received = balance.received;
      patch.outstanding = balance.outstanding;
      if (input.status === undefined) patch.status = balance.status;
    }
    if (input.status !== undefined) patch.status = input.status;

    const updated = await invoiceRepository.updateOrThrow(id, patch, 'Invoice');

    await this.syncCustomerOutstanding(updated.customerId);
    if (input.customerId && input.customerId !== existing.customerId) {
      await this.syncCustomerOutstanding(existing.customerId);
    }
    if (updated.status === 'paid' && normalizeInvoiceStatus(existing.status) !== 'paid') {
      await this.advanceLinkedComponentRenewals(updated);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.getById(id);
    for (const payment of await this.listPaymentsForInvoice(id)) {
      await paymentRepository.deleteOrThrow(payment.id, 'Payment');
    }
    await invoiceRepository.updateOrThrow(
      id,
      {
        timeline: prependInvoiceTimeline(
          existing.timeline,
          createInvoiceTimelineEntry({ action: 'deleted' }),
        ),
      },
      'Invoice',
    );
    await invoiceRepository.deleteOrThrow(id, 'Invoice');
    await this.syncCustomerOutstanding(existing.customerId);
  }

  async restore(id: string): Promise<InvoiceEntity> {
    await invoiceRepository.restore(id);
    return this.recalculateInvoice(id);
  }

  async changeStatus(id: string, status: InvoiceEntity['status']): Promise<InvoiceEntity> {
    const existing = await this.getById(id);
    if (normalizeInvoiceStatus(existing.status) === 'cancelled') {
      throw new ValidationError('Cancelled invoices cannot change status');
    }
    if (status === 'cancelled') {
      throw new ValidationError('Use Cancel Invoice to cancel an invoice');
    }

    const payments = await this.listPaymentsForInvoice(id);
    const balance = applyBalance(existing, payments);

    // Never allow manual `paid` when balance says otherwise; never override
    // payment-derived paid/partially_paid with an arbitrary status.
    let nextStatus = normalizeInvoiceStatus(status);
    if (balance.outstanding <= 0.001) {
      nextStatus = 'paid';
    } else if (status === 'paid') {
      throw new ValidationError('Cannot mark invoice as paid while outstanding balance remains', [
        `Outstanding balance is ${balance.outstanding}`,
      ]);
    } else if (balance.received > 0 && (status === 'draft' || status === 'due')) {
      nextStatus = balance.status;
    }

    const timeline = prependInvoiceTimeline(
      existing.timeline,
      createInvoiceTimelineEntry({
        action: 'status_changed',
        notes: `Status set to ${nextStatus}`,
      }),
    );
    const updated = await invoiceRepository.updateOrThrow(
      id,
      {
        status: nextStatus,
        received: balance.received,
        outstanding: balance.outstanding,
        timeline,
      },
      'Invoice',
    );
    await this.syncCustomerOutstanding(updated.customerId);
    return updated;
  }

  async cancel(
    id: string,
    input: InvoiceCancelInput,
    cancelledBy: string,
  ): Promise<InvoiceEntity> {
    const existing = await this.getById(id);
    if (normalizeInvoiceStatus(existing.status) === 'cancelled') {
      throw new ValidationError('Invoice is already cancelled');
    }

    const cancelledAt = toISOString();
    const actor = cancelledBy.trim() || 'system';
    const reason = input.reason.trim();
    const timeline = prependInvoiceTimeline(
      existing.timeline,
      createInvoiceTimelineEntry({
        action: 'cancelled',
        stageName: 'Cancelled',
        notes: `Cancelled by ${actor}: ${reason}`,
      }),
    );

    const updated = await invoiceRepository.updateOrThrow(
      id,
      {
        status: 'cancelled',
        outstanding: 0,
        cancelledReason: reason,
        cancelledAt,
        cancelledBy: actor,
        timeline,
      },
      'Invoice',
    );
    await this.syncCustomerOutstanding(updated.customerId);
    return updated;
  }

  async listPayments(invoiceId: string): Promise<PaymentEntity[]> {
    await this.getById(invoiceId);
    return this.listPaymentsForInvoice(invoiceId);
  }

  /** Single sheet read for SPA revenue bootstrap (avoids N× GET /:id/payments). */
  async listAllPayments(): Promise<PaymentEntity[]> {
    const [payments, invoices] = await Promise.all([
      paymentRepository.findAll(),
      invoiceRepository.findAll(),
    ]);
    const liveInvoiceIds = new Set(invoices.map((invoice) => invoice.id));
    return payments.filter((payment) => liveInvoiceIds.has(payment.invoiceId));
  }

  async addPayment(
    invoiceId: string,
    input: PaymentCreateInput,
  ): Promise<{ payment: PaymentEntity; invoice: InvoiceEntity }> {
    let invoice = await this.getById(invoiceId);
    if (normalizeInvoiceStatus(invoice.status) === 'cancelled') {
      throw new ValidationError('Cancelled invoices cannot accept payments');
    }

    const removeGstReason = (input.removeGstReason ?? '').trim();
    if (removeGstReason && invoice.billingType === 'gst') {
      invoice = await this.update(invoiceId, {
        billingType: 'non_gst',
        billingChangeReason: removeGstReason,
      });
    }

    const existingPayments = await this.listPaymentsForInvoice(invoiceId);
    const { outstanding: nextOutstanding } = applyBalance(invoice, existingPayments);

    if (input.status === 'received' && input.amount > nextOutstanding + 0.001) {
      throw new ValidationError('Payment cannot exceed outstanding balance', [
        `Outstanding balance is ${nextOutstanding}`,
      ]);
    }

    const payment = await paymentRepository.create({
      invoiceId,
      customerId: invoice.customerId,
      amount: roundMoney(input.amount),
      currency: input.currency.trim() || invoice.currency || 'INR',
      method: input.mode.trim(),
      status: input.status,
      paidAt: input.paymentDate,
      reference: input.referenceNumber.trim(),
      receivedBy: input.receivedBy.trim(),
      transactionId: input.transactionId.trim(),
      notes: input.notes.trim(),
      receivedAccount:
        input.receivedAccount ?? (invoice.billingType === 'gst' ? 'gst' : 'other'),
    } as Omit<PaymentEntity, 'id'>);

    const invoiceUpdated = await this.recalculateInvoice(invoiceId, {
      action: 'payment_recorded',
      notes: `Payment of ${payment.amount} recorded`,
    });

    return { payment, invoice: invoiceUpdated };
  }

  async updatePayment(
    invoiceId: string,
    paymentId: string,
    input: PaymentUpdateInput,
  ): Promise<{ payment: PaymentEntity; invoice: InvoiceEntity }> {
    const invoice = await this.getById(invoiceId);
    if (normalizeInvoiceStatus(invoice.status) === 'cancelled') {
      throw new ValidationError('Cancelled invoices cannot accept payment changes');
    }
    const existing = await paymentRepository.findById(paymentId);
    if (!existing || existing.invoiceId !== invoiceId) {
      throw new NotFoundError('Payment not found');
    }

    const candidate: PaymentEntity = {
      ...existing,
      amount: input.amount !== undefined ? roundMoney(input.amount) : existing.amount,
      method: input.mode !== undefined ? input.mode.trim() : existing.method,
      status: input.status !== undefined ? input.status : existing.status,
      paidAt: input.paymentDate !== undefined ? input.paymentDate : existing.paidAt,
      reference:
        input.referenceNumber !== undefined
          ? input.referenceNumber.trim()
          : existing.reference,
      receivedBy:
        input.receivedBy !== undefined ? input.receivedBy.trim() : existing.receivedBy,
      transactionId:
        input.transactionId !== undefined
          ? input.transactionId.trim()
          : existing.transactionId,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      currency:
        input.currency !== undefined ? input.currency.trim() : existing.currency,
      receivedAccount: input.receivedAccount ?? existing.receivedAccount,
    };

    const otherPayments = (await this.listPaymentsForInvoice(invoiceId)).filter(
      (payment) => payment.id !== paymentId,
    );
    const projected = applyBalance(invoice, [...otherPayments, candidate]);
    if (projected.outstanding < -0.001) {
      throw new ValidationError('Payment cannot exceed outstanding balance', [
        `Projected outstanding would be ${projected.outstanding}`,
      ]);
    }

    const payment = await paymentRepository.updateOrThrow(
      paymentId,
      {
        amount: candidate.amount,
        method: candidate.method,
        status: candidate.status,
        paidAt: candidate.paidAt,
        reference: candidate.reference,
        receivedBy: candidate.receivedBy,
        transactionId: candidate.transactionId,
        notes: candidate.notes,
        currency: candidate.currency,
        receivedAccount: candidate.receivedAccount,
      } as Partial<PaymentEntity>,
      'Payment',
    );

    const invoiceUpdated = await this.recalculateInvoice(invoiceId, {
      action: 'outstanding_updated',
    });

    return { payment, invoice: invoiceUpdated };
  }

  async removePayment(invoiceId: string, paymentId: string): Promise<InvoiceEntity> {
    await this.getById(invoiceId);
    const existing = await paymentRepository.findById(paymentId);
    if (!existing || existing.invoiceId !== invoiceId) {
      throw new NotFoundError('Payment not found');
    }
    await paymentRepository.deleteOrThrow(paymentId, 'Payment');
    return this.recalculateInvoice(invoiceId, { action: 'outstanding_updated' });
  }

  async listFiles(invoiceId: string): Promise<DocumentEntity[]> {
    await this.getById(invoiceId);
    const documents = await documentRepository.findAll();
    return documents.filter(
      (doc) => doc.entityType === DOCUMENT_ENTITY_TYPE && doc.entityId === invoiceId,
    );
  }

  async addFile(
    invoiceId: string,
    input: InvoiceDocumentCreateInput,
  ): Promise<{ document: DocumentEntity; invoice: InvoiceEntity }> {
    const invoice = await this.getById(invoiceId);
    const uploaded = await uploadDocumentToDrive({
      name: input.name,
      mimeType: input.mimeType,
      contentBase64: input.contentBase64,
    });
    const fileType = deriveFileType(input.name, input.fileType);

    const document = await documentRepository.create({
      name: input.name.trim(),
      fileType,
      mimeType: input.mimeType.trim() || uploaded.mimeType,
      size: input.size || uploaded.size || 0,
      driveFileId: uploaded.id,
      entityType: DOCUMENT_ENTITY_TYPE,
      entityId: invoiceId,
      uploadedBy: '',
    } as Omit<DocumentEntity, 'id'>);

    const updated = await invoiceRepository.updateOrThrow(
      invoiceId,
      {
        timeline: prependInvoiceTimeline(
          invoice.timeline,
          createInvoiceTimelineEntry({
            action: 'updated',
            stageName: 'Document Linked',
            notes: document.name,
          }),
        ),
      },
      'Invoice',
    );

    return { document, invoice: updated };
  }

  async removeFile(invoiceId: string, fileId: string): Promise<void> {
    await this.getById(invoiceId);
    const document = await documentRepository.findById(fileId);
    if (
      !document ||
      document.entityType !== DOCUMENT_ENTITY_TYPE ||
      document.entityId !== invoiceId
    ) {
      throw new NotFoundError('Document not found');
    }
    await deleteDriveFileQuietly(document.driveFileId);
    await documentRepository.deleteOrThrow(fileId, 'Document');
  }

  /**
   * Saved line items are re-taxed when GST changes, and the totals are taken from
   * them so the invoice header always equals the sum of its lines. Lines that no
   * longer add up to the subtotal are dropped rather than shown wrong.
   */
  private async resolveUpdatedAmounts(
    existing: InvoiceEntity,
    input: InvoiceUpdateInput,
    billingType: InvoiceBillingType,
  ): Promise<{
    subtotal: number;
    taxPercent: number;
    tax: number;
    total: number;
    lineItems: InvoiceLineItem[];
  }> {
    const billingChanged = billingType !== existing.billingType;
    let amounts = resolveUpdateAmounts(existing, {
      subtotal: input.subtotal,
      taxPercent: input.taxPercent,
      tax: input.tax,
      total: input.total,
    });

    if (billingType === 'non_gst') {
      const base =
        amounts.subtotal > 0 ? amounts.subtotal : roundMoney(amounts.total - amounts.tax);
      amounts = { subtotal: base, taxPercent: 0, tax: 0, total: base };
    } else if (billingChanged) {
      const rate =
        input.taxPercent !== undefined && input.taxPercent > 0
          ? input.taxPercent
          : await this.defaultGstPercentFor(existing);
      const base = amounts.subtotal > 0 ? amounts.subtotal : amounts.total;
      const tax = computeTaxAmount(base, rate);
      amounts = { subtotal: base, taxPercent: rate, tax, total: roundMoney(base + tax) };
    }

    if (!lineItemsMatchSubtotal(existing.lineItems, amounts.subtotal)) {
      return { ...amounts, lineItems: [] };
    }
    const rateChanged =
      billingChanged || roundMoney(amounts.taxPercent) !== roundMoney(existing.taxPercent);
    if (!rateChanged) {
      return { ...amounts, lineItems: existing.lineItems };
    }
    const lineItems = repriceLineItems(existing.lineItems, amounts.taxPercent);
    return { ...totalsFromLineItems(lineItems), lineItems };
  }

  /**
   * A single rate (the user's GST %, or 0 for non-GST) applies to every line when
   * the components share one rate; mixed-rate components keep their own rates.
   */
  private async amountsFromSelectedComponents(
    componentIds: string[] | undefined,
    taxPercent: number | undefined,
    billingType: InvoiceBillingType,
  ): Promise<{
    subtotal: number;
    taxPercent: number;
    tax: number;
    total: number;
    lineItems: InvoiceLineItem[];
  } | null> {
    if (!componentIds?.length) return null;

    const components = await dealComponentRepository.findAll();
    const selected = components.filter((component) =>
      componentIds.includes(component.id),
    );
    if (selected.length === 0) return null;

    const rates = [
      ...new Set(selected.map((component) => Number(component.gstPercent || 0))),
    ];
    const uniformPercent =
      billingType === 'non_gst'
        ? 0
        : rates.length === 1
          ? taxPercent !== undefined && Number.isFinite(taxPercent)
            ? taxPercent
            : rates[0]
          : undefined;

    const lineItems = selected.map((component) =>
      buildLineItem({
        componentId: component.id,
        name: component.name,
        taxable: computeComponentTaxable(component),
        gstPercent: uniformPercent ?? Number(component.gstPercent || 0),
      }),
    );
    return { ...totalsFromLineItems(lineItems), lineItems };
  }

  /** GST rate to use when a non-GST invoice is switched to GST without a stated rate. */
  private async defaultGstPercentFor(invoice: InvoiceEntity): Promise<number> {
    const fromLines = invoice.lineItems.find((line) => line.gstPercent > 0)?.gstPercent;
    if (fromLines) return fromLines;
    const components = await dealComponentRepository.findAll();
    const fromComponents = components.find(
      (component) =>
        invoice.componentIds.includes(component.id) && Number(component.gstPercent) > 0,
    )?.gstPercent;
    return Number(fromComponents) || DEFAULT_GST_PERCENT;
  }

  private async listPaymentsForInvoice(invoiceId: string): Promise<PaymentEntity[]> {
    const payments = await paymentRepository.findAll();
    return payments.filter((payment) => payment.invoiceId === invoiceId);
  }

  private async recalculateInvoice(
    invoiceId: string,
    timelineEvent?: { action: 'payment_recorded' | 'outstanding_updated'; notes?: string },
  ): Promise<InvoiceEntity> {
    const invoice = await this.getById(invoiceId);
    const payments = await this.listPaymentsForInvoice(invoiceId);
    const balance = applyBalance(invoice, payments);

    let timeline = invoice.timeline;
    if (timelineEvent) {
      timeline = prependInvoiceTimeline(
        timeline,
        createInvoiceTimelineEntry({
          action: timelineEvent.action,
          notes: timelineEvent.notes,
        }),
      );
    }

    const updated = await invoiceRepository.updateOrThrow(
      invoiceId,
      {
        received: balance.received,
        outstanding: balance.outstanding,
        status: balance.status,
        timeline,
      },
      'Invoice',
    );

    await this.syncCustomerOutstanding(updated.customerId);
    if (updated.status === 'paid') {
      await this.advanceLinkedComponentRenewals(updated);
    }
    return updated;
  }

  /** When an invoice is fully paid, that payment covers the current unpaid renewal cycle. */
  private async advanceLinkedComponentRenewals(invoice: InvoiceEntity): Promise<void> {
    const componentIds = Array.isArray(invoice.componentIds) ? invoice.componentIds : [];
    for (const componentId of componentIds) {
      if (!componentId?.trim()) continue;
      const component = await dealComponentRepository.findById(componentId);
      if (!component) continue;
      const advanced = tryAdvanceComponentRenewal(component);
      if (!advanced) continue;
      await dealComponentRepository.updateOrThrow(
        componentId,
        {
          lastRenewedDate: advanced.lastRenewedDate,
          renewalDate: advanced.renewalDate,
          status: advanced.status,
        },
        'Component',
      );
    }
  }

  /** Keep denormalized customer.outstandingAmount aligned with invoice balances. */
  private async syncCustomerOutstanding(customerId: string): Promise<void> {
    if (!customerId.trim()) return;

    const customer = await customerRepository.findById(customerId);
    if (!customer) return;

    const invoices = await invoiceRepository.findAll();
    const outstanding = sumCollectionOutstandingForCustomer(invoices, customerId);

    if (Math.abs(Number(customer.outstandingAmount || 0) - outstanding) < 0.001) {
      return;
    }

    await customerRepository.update(customerId, { outstandingAmount: outstanding });
  }

  private async assertUniqueInvoiceNumber(
    invoiceNumber: string,
    excludeId?: string,
  ): Promise<void> {
    const entities = (await invoiceRepository.findAll()) as Array<
      { id: string } & Record<string, unknown>
    >;
    assertUniqueField(entities, {
      field: 'invoiceNumber',
      value: invoiceNumber,
      label: 'Invoice',
      excludeId,
    });
  }

  private async validateInvoiceRefs(input: {
    customerId?: string;
    dealId?: string;
  }): Promise<void> {
    const normalized: Record<string, unknown> = {};
    if (input.customerId?.trim()) normalized.customerId = input.customerId;
    if (input.dealId?.trim()) normalized.dealId = input.dealId;

    await assertForeignKeys(normalized, [
      {
        field: 'customerId',
        label: 'Customer',
        exists: async (id) => Boolean(await customerRepository.findById(id)),
      },
      {
        field: 'dealId',
        label: 'Deal',
        exists: async (id) => Boolean(await dealRepository.findById(id)),
      },
    ]);
  }
}

export const invoiceService = new InvoiceService();
