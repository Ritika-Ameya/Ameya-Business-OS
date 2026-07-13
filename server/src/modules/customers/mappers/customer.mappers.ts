import type { BaseEntity } from '../../../types';
import type { CustomerTimelineEntry } from '../../../types/entity.contracts';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseBoolean, parseNumberField } from '../../../utils/sheetMapper.util';
import type { CustomerEntity, DocumentEntity } from '../types/customer.entities';

const str = (record: Record<string, string>, key: string, fallback = ''): string =>
  record[key] ?? fallback;

const bool = (record: Record<string, string>, key: string, fallback = false): boolean => {
  const raw = record[key];
  if (raw === undefined || raw === '') return fallback;
  return parseBoolean(raw);
};

const num = (record: Record<string, string>, key: string, fallback = 0): number =>
  parseNumberField(record[key], fallback);

const rowStr = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? '');

const rowBool = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? false);

const parseTags = (raw: string): string[] => {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    // fall through to CSV
  }
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const serializeTags = (tags: string[] | undefined): string =>
  JSON.stringify(Array.isArray(tags) ? tags : []);

const parseTimeline = (raw: string): CustomerTimelineEntry[] => {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        id: String(item.id ?? ''),
        action: item.action ? String(item.action) : undefined,
        stageId: item.stageId ? String(item.stageId) : undefined,
        stageName: String(item.stageName ?? ''),
        notes: item.notes ? String(item.notes) : undefined,
        nextActionDate: item.nextActionDate ? String(item.nextActionDate) : undefined,
        timestamp: String(item.timestamp ?? ''),
      };
    });
  } catch {
    return [];
  }
};

const serializeTimeline = (timeline: CustomerTimelineEntry[] | undefined): string =>
  JSON.stringify(Array.isArray(timeline) ? timeline : []);

export const customerMapper = createBaseEntityMapper<CustomerEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    recordType: (str(record, 'recordType', 'opportunity') as CustomerEntity['recordType']),
    status: (str(record, 'status', 'prospect') as CustomerEntity['status']),
    currentStageId: str(record, 'currentStageId'),
    companyName: str(record, 'companyName'),
    gstin: str(record, 'gstin'),
    industryId: str(record, 'industryId'),
    sourceId: str(record, 'sourceId'),
    contactPerson: str(record, 'contactPerson'),
    phone: str(record, 'phone'),
    alternatePhone: str(record, 'alternatePhone'),
    email: str(record, 'email'),
    website: str(record, 'website'),
    billingAddress: str(record, 'billingAddress'),
    serviceAddress: str(record, 'serviceAddress'),
    countryId: str(record, 'countryId'),
    stateId: str(record, 'stateId'),
    city: str(record, 'city'),
    pincode: str(record, 'pincode'),
    notes: str(record, 'notes'),
    businessValue: num(record, 'businessValue'),
    expectedRevenue: num(record, 'expectedRevenue'),
    nextActionDate: str(record, 'nextActionDate'),
    lastContactDate: str(record, 'lastContactDate'),
    renewalDate: str(record, 'renewalDate'),
    outstandingAmount: num(record, 'outstandingAmount'),
    tags: parseTags(str(record, 'tags')),
    isActive: bool(record, 'isActive', true),
    timeline: parseTimeline(str(record, 'timeline')),
    activeDeals: num(record, 'activeDeals'),
    lastPayment: str(record, 'lastPayment'),
    businessSince: str(record, 'businessSince'),
  }),
  (entity) => ({
    recordType: rowStr(entity, 'recordType'),
    status: rowStr(entity, 'status'),
    currentStageId: rowStr(entity, 'currentStageId'),
    companyName: rowStr(entity, 'companyName'),
    gstin: rowStr(entity, 'gstin'),
    industryId: rowStr(entity, 'industryId'),
    sourceId: rowStr(entity, 'sourceId'),
    contactPerson: rowStr(entity, 'contactPerson'),
    phone: rowStr(entity, 'phone'),
    alternatePhone: rowStr(entity, 'alternatePhone'),
    email: rowStr(entity, 'email'),
    website: rowStr(entity, 'website'),
    billingAddress: rowStr(entity, 'billingAddress'),
    serviceAddress: rowStr(entity, 'serviceAddress'),
    countryId: rowStr(entity, 'countryId'),
    stateId: rowStr(entity, 'stateId'),
    city: rowStr(entity, 'city'),
    pincode: rowStr(entity, 'pincode'),
    notes: rowStr(entity, 'notes'),
    businessValue: String(entity.businessValue ?? 0),
    expectedRevenue: String(entity.expectedRevenue ?? 0),
    nextActionDate: rowStr(entity, 'nextActionDate'),
    lastContactDate: rowStr(entity, 'lastContactDate'),
    renewalDate: rowStr(entity, 'renewalDate'),
    outstandingAmount: String(entity.outstandingAmount ?? 0),
    tags: serializeTags(entity.tags),
    isActive: rowBool(entity, 'isActive'),
    timeline: serializeTimeline(entity.timeline),
    activeDeals: String(entity.activeDeals ?? 0),
    lastPayment: rowStr(entity, 'lastPayment'),
    businessSince: rowStr(entity, 'businessSince'),
  }),
);

export const documentMapper = createBaseEntityMapper<DocumentEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    fileType: str(record, 'fileType'),
    mimeType: str(record, 'mimeType'),
    size: num(record, 'size'),
    driveFileId: str(record, 'driveFileId'),
    entityType: str(record, 'entityType'),
    entityId: str(record, 'entityId'),
    uploadedBy: str(record, 'uploadedBy'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    fileType: rowStr(entity, 'fileType'),
    mimeType: rowStr(entity, 'mimeType'),
    size: String(entity.size ?? 0),
    driveFileId: rowStr(entity, 'driveFileId'),
    entityType: rowStr(entity, 'entityType'),
    entityId: rowStr(entity, 'entityId'),
    uploadedBy: rowStr(entity, 'uploadedBy'),
  }),
);
