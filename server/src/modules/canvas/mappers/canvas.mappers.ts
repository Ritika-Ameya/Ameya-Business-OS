import type { BaseEntity } from '../../../types';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseNumberField } from '../../../utils/sheetMapper.util';
import type {
  ExpectedReceiptEntity,
  LeadTemperatureEntity,
  LeadTemperatureValue,
  ReceiptOrigin,
  ReceiptSourceRefType,
  ReceiptSourceType,
  ReceiptStoredStatus,
} from '../types/canvas.entities';

const str = (record: Record<string, string>, key: string, fallback = ''): string =>
  record[key] ?? fallback;

const num = (record: Record<string, string>, key: string, fallback = 0): number =>
  parseNumberField(record[key], fallback);

const rowStr = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? '');

const ORIGINS = new Set<ReceiptOrigin>(['override', 'manual', 'installment', 'dismissed']);
const SOURCES = new Set<ReceiptSourceType>([
  'invoice_balance',
  'invoice_installment',
  'renewal',
  'license',
  'subscription',
  'deal_advance',
  'deal_expected',
  'opportunity_conversion',
  'other',
]);
const REF_TYPES = new Set<ReceiptSourceRefType>(['invoice', 'component', 'deal', 'customer', '']);
const STATUSES = new Set<ReceiptStoredStatus>(['expected', 'received', 'cancelled', 'superseded']);
const TEMPERATURES = new Set<LeadTemperatureValue>(['hot', 'warm', 'cold']);

const asOrigin = (value: string): ReceiptOrigin =>
  ORIGINS.has(value as ReceiptOrigin) ? (value as ReceiptOrigin) : 'manual';

const asSource = (value: string): ReceiptSourceType =>
  SOURCES.has(value as ReceiptSourceType) ? (value as ReceiptSourceType) : 'other';

const asRefType = (value: string): ReceiptSourceRefType =>
  REF_TYPES.has(value as ReceiptSourceRefType) ? (value as ReceiptSourceRefType) : '';

const asStatus = (value: string): ReceiptStoredStatus =>
  STATUSES.has(value as ReceiptStoredStatus) ? (value as ReceiptStoredStatus) : 'expected';

const asTemperature = (value: string): LeadTemperatureValue =>
  TEMPERATURES.has(value as LeadTemperatureValue) ? (value as LeadTemperatureValue) : 'warm';

export const expectedReceiptMapper = createBaseEntityMapper<ExpectedReceiptEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    origin: asOrigin(str(record, 'origin', 'manual')),
    sourceType: asSource(str(record, 'sourceType', 'other')),
    sourceRefType: asRefType(str(record, 'sourceRefType')),
    sourceRefId: str(record, 'sourceRefId'),
    customerId: str(record, 'customerId'),
    dealId: str(record, 'dealId'),
    invoiceId: str(record, 'invoiceId'),
    componentId: str(record, 'componentId'),
    installmentIndex: num(record, 'installmentIndex', 1),
    expectedAmount: num(record, 'expectedAmount'),
    currency: str(record, 'currency', 'INR'),
    expectedDate: str(record, 'expectedDate').slice(0, 10),
    reason: str(record, 'reason'),
    status: asStatus(str(record, 'status', 'expected')),
  }),
  (entity) => ({
    origin: rowStr(entity, 'origin'),
    sourceType: rowStr(entity, 'sourceType'),
    sourceRefType: rowStr(entity, 'sourceRefType'),
    sourceRefId: rowStr(entity, 'sourceRefId'),
    customerId: rowStr(entity, 'customerId'),
    dealId: rowStr(entity, 'dealId'),
    invoiceId: rowStr(entity, 'invoiceId'),
    componentId: rowStr(entity, 'componentId'),
    installmentIndex: String(entity.installmentIndex ?? 1),
    expectedAmount: String(entity.expectedAmount ?? 0),
    currency: rowStr(entity, 'currency') || 'INR',
    expectedDate: rowStr(entity, 'expectedDate'),
    reason: rowStr(entity, 'reason'),
    status: rowStr(entity, 'status'),
  }),
);

export const leadTemperatureMapper = createBaseEntityMapper<LeadTemperatureEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    customerId: str(record, 'customerId'),
    temperature: asTemperature(str(record, 'temperature')),
  }),
  (entity) => ({
    customerId: rowStr(entity, 'customerId'),
    temperature: rowStr(entity, 'temperature'),
  }),
);
