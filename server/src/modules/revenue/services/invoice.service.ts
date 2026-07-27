import type { PaginatedResult, QueryOptions } from '../../../types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../../constants';
import { BaseService } from '../../../services/base.service';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import { assertForeignKeys } from '../../../utils/foreignKey.util';
import { assertUniqueField } from '../../../utils/uniqueness.util';
import { applyFilters } from '../../../utils/filtering.util';
import { applySort } from '../../../utils/sorting.util';
import { paginateArray } from '../../../utils/pagination.util';
import { invoiceConfigurationRepository } from '../../masters/services/master.services';
import { customerRepository, documentRepository } from '../../customers';
import type { DocumentEntity } from '../../customers';
import { dealRepository } from '../../deals';
import type { InvoiceEntity, PaymentEntity } from '../types/revenue.entities';
import type {
  InvoiceCreateInput,
  InvoiceDocumentCreateInput,
  InvoiceUpdateInput,
  PaymentCreateInput,
  PaymentUpdateInput,
} from '../validators/revenue.validators';
import { invoiceRepository, paymentRepository } from './revenue.repository';
import {
  applyInvoiceSearch,
  parseSearchFields,
  parseSearchMode,
} from '../utils/invoiceSearch.util';
import {
  applyBalance,
  resolveCreateAmounts,
  resolveUpdateAmounts,
  roundMoney,
} from '../utils/invoiceCalculation.util';
import { createInvoiceTimelineEntry, prependInvoiceTimeline } from '../utils/timeline.util';

const DOCUMENT_ENTITY_TYPE = 'invoice';

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

    const { subtotal, taxPercent, tax, total } = resolveCreateAmounts({
      subtotal: input.subtotal,
      taxPercent: input.taxPercent,
      tax: input.tax,
      total: input.total,
    });

    const invoiceNumber =
      input.invoiceNumber.trim() || (await this.allocateInvoiceNumber());

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
      status: input.status,
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

    if (input.invoiceNumber && input.invoiceNumber !== existing.invoiceNumber) {
      await this.assertUniqueInvoiceNumber(input.invoiceNumber, id);
    }

    const { subtotal, taxPercent, tax, total } = resolveUpdateAmounts(existing, {
      subtotal: input.subtotal,
      taxPercent: input.taxPercent,
      tax: input.tax,
      total: input.total,
    });

    const payments = await this.listPaymentsForInvoice(id);
    const balance = applyBalance({ ...existing, total }, payments);

    const timeline = prependInvoiceTimeline(
      existing.timeline,
      createInvoiceTimelineEntry({ action: 'updated' }),
    );

    const updated = await invoiceRepository.updateOrThrow(
      id,
      {
        ...input,
        customerName: input.customerName?.trim(),
        dealTitle: input.dealTitle?.trim(),
        notes: input.notes?.trim(),
        currency: input.currency?.trim(),
        subtotal,
        taxPercent,
        tax,
        total,
        received: balance.received,
        outstanding: balance.outstanding,
        status: input.status ?? balance.status,
        timeline,
      } as Partial<InvoiceEntity>,
      'Invoice',
    );

    await this.syncCustomerOutstanding(updated.customerId);
    if (input.customerId && input.customerId !== existing.customerId) {
      await this.syncCustomerOutstanding(existing.customerId);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.getById(id);
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
    const restored = await invoiceRepository.restore(id);
    await this.syncCustomerOutstanding(restored.customerId);
    return restored;
  }

  async changeStatus(id: string, status: InvoiceEntity['status']): Promise<InvoiceEntity> {
    const existing = await this.getById(id);
    const payments = await this.listPaymentsForInvoice(id);
    const balance = applyBalance(existing, payments);

    // Never allow manual `paid` when balance says otherwise; never override
    // payment-derived paid/partial with an arbitrary status.
    let nextStatus = status;
    if (balance.outstanding <= 0.001) {
      nextStatus = 'paid';
    } else if (status === 'paid') {
      throw new ValidationError('Cannot mark invoice as paid while outstanding balance remains', [
        `Outstanding balance is ${balance.outstanding}`,
      ]);
    } else if (balance.received > 0 && (status === 'draft' || status === 'sent')) {
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

  async listPayments(invoiceId: string): Promise<PaymentEntity[]> {
    await this.getById(invoiceId);
    return this.listPaymentsForInvoice(invoiceId);
  }

  async addPayment(
    invoiceId: string,
    input: PaymentCreateInput,
  ): Promise<{ payment: PaymentEntity; invoice: InvoiceEntity }> {
    const invoice = await this.getById(invoiceId);
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
    const fileType =
      input.fileType.trim() ||
      (input.name.includes('.') ? (input.name.split('.').pop()?.toLowerCase() ?? '') : '');

    const document = await documentRepository.create({
      name: input.name.trim(),
      fileType,
      mimeType: input.mimeType.trim(),
      size: input.size,
      driveFileId: '',
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
    await documentRepository.deleteOrThrow(fileId, 'Document');
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
    return updated;
  }

  /** Keep denormalized customer.outstandingAmount aligned with invoice balances. */
  private async syncCustomerOutstanding(customerId: string): Promise<void> {
    if (!customerId.trim()) return;

    const customer = await customerRepository.findById(customerId);
    if (!customer) return;

    const invoices = await invoiceRepository.findAll();
    const outstanding = roundMoney(
      invoices
        .filter((invoice) => invoice.customerId === customerId)
        .reduce((sum, invoice) => sum + Number(invoice.outstanding || 0), 0),
    );

    if (Math.abs(Number(customer.outstandingAmount || 0) - outstanding) < 0.001) {
      return;
    }

    await customerRepository.update(customerId, { outstandingAmount: outstanding });
  }

  private async allocateInvoiceNumber(): Promise<string> {
    const configs = await invoiceConfigurationRepository.findAll();
    const config = configs[0];
    const prefix = config?.invoicePrefix?.trim() || 'INV';
    const configuredRaw = config?.nextInvoiceNumber?.trim() || '0001';
    const width = configuredRaw.replace(/\D/g, '').length || 4;

    const existing = await invoiceRepository.findAll();
    const used = new Set(
      existing
        .map((invoice) => String(invoice.invoiceNumber || '').trim().toUpperCase())
        .filter(Boolean),
    );

    let numeric = Number.parseInt(configuredRaw.replace(/\D/g, ''), 10);
    if (Number.isNaN(numeric) || numeric < 1) numeric = 1;

    // Advance past any numbers already used (config can drift after deletes / restores).
    let invoiceNumber = `${prefix}-${String(numeric).padStart(width, '0')}`;
    while (used.has(invoiceNumber.toUpperCase())) {
      numeric += 1;
      invoiceNumber = `${prefix}-${String(numeric).padStart(width, '0')}`;
    }

    if (config) {
      const nextInvoiceNumber = String(numeric + 1).padStart(width, '0');
      await invoiceConfigurationRepository.updateOrThrow(
        config.id,
        { nextInvoiceNumber },
        'Invoice Configuration',
      );
    }

    return invoiceNumber;
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
