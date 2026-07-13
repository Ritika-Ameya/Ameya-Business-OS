import type { BaseEntity } from '../../../types';
import type { InvoiceTimelineEntry } from '../../../types/entity.contracts';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseNumberField } from '../../../utils/sheetMapper.util';
import type { InvoiceEntity, PaymentEntity } from '../types/revenue.entities';

const str = (record: Record<string, string>, key: string, fallback = ''): string =>
  record[key] ?? fallback;

const num = (record: Record<string, string>, key: string, fallback = 0): number =>
  parseNumberField(record[key], fallback);

const rowStr = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? '');

const parseJsonArray = (raw: string): string[] => {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // csv fallback
  }
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const parseTimeline = (raw: string): InvoiceTimelineEntry[] => {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        id: String(item.id ?? ''),
        action: item.action ? String(item.action) : undefined,
        stageName: String(item.stageName ?? ''),
        notes: item.notes ? String(item.notes) : undefined,
        timestamp: String(item.timestamp ?? ''),
      };
    });
  } catch {
    return [];
  }
};

export const invoiceMapper = createBaseEntityMapper<InvoiceEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    invoiceNumber: str(record, 'invoiceNumber'),
    customerId: str(record, 'customerId'),
    customerName: str(record, 'customerName'),
    dealId: str(record, 'dealId'),
    dealTitle: str(record, 'dealTitle'),
    status: (str(record, 'status', 'draft') as InvoiceEntity['status']),
    issueDate: str(record, 'issueDate'),
    dueDate: str(record, 'dueDate'),
    subtotal: num(record, 'subtotal'),
    taxPercent: num(record, 'taxPercent'),
    tax: num(record, 'tax'),
    total: num(record, 'total'),
    currency: str(record, 'currency', 'INR'),
    received: num(record, 'received'),
    outstanding: num(record, 'outstanding'),
    componentIds: parseJsonArray(str(record, 'componentIds')),
    notes: str(record, 'notes'),
    timeline: parseTimeline(str(record, 'timeline')),
  }),
  (entity) => ({
    invoiceNumber: rowStr(entity, 'invoiceNumber'),
    customerId: rowStr(entity, 'customerId'),
    customerName: rowStr(entity, 'customerName'),
    dealId: rowStr(entity, 'dealId'),
    dealTitle: rowStr(entity, 'dealTitle'),
    status: rowStr(entity, 'status'),
    issueDate: rowStr(entity, 'issueDate'),
    dueDate: rowStr(entity, 'dueDate'),
    subtotal: String(entity.subtotal ?? 0),
    taxPercent: String(entity.taxPercent ?? 0),
    tax: String(entity.tax ?? 0),
    total: String(entity.total ?? 0),
    currency: rowStr(entity, 'currency'),
    received: String(entity.received ?? 0),
    outstanding: String(entity.outstanding ?? 0),
    componentIds: JSON.stringify(entity.componentIds ?? []),
    notes: rowStr(entity, 'notes'),
    timeline: JSON.stringify(entity.timeline ?? []),
  }),
);

export const paymentMapper = createBaseEntityMapper<PaymentEntity>(
  (record, base) => ({
    ...base,
    invoiceId: str(record, 'invoiceId'),
    customerId: str(record, 'customerId'),
    amount: num(record, 'amount'),
    currency: str(record, 'currency', 'INR'),
    method: str(record, 'method'),
    status: (str(record, 'status', 'received') as PaymentEntity['status']),
    paidAt: str(record, 'paidAt'),
    reference: str(record, 'reference'),
    receivedBy: str(record, 'receivedBy'),
    transactionId: str(record, 'transactionId'),
    notes: str(record, 'notes'),
  }),
  (entity) => ({
    invoiceId: rowStr(entity, 'invoiceId'),
    customerId: rowStr(entity, 'customerId'),
    amount: String(entity.amount ?? 0),
    currency: rowStr(entity, 'currency'),
    method: rowStr(entity, 'method'),
    status: rowStr(entity, 'status'),
    paidAt: rowStr(entity, 'paidAt'),
    reference: rowStr(entity, 'reference'),
    receivedBy: rowStr(entity, 'receivedBy'),
    transactionId: rowStr(entity, 'transactionId'),
    notes: rowStr(entity, 'notes'),
  }),
);
