import type { BaseEntity } from '../../../types';
import type { DealTimelineEntry } from '../../../types/entity.contracts';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseNumberField } from '../../../utils/sheetMapper.util';
import type { DealComponentEntity, DealEntity } from '../types/deal.entities';

const str = (record: Record<string, string>, key: string, fallback = ''): string =>
  record[key] ?? fallback;

const num = (record: Record<string, string>, key: string, fallback = 0): number =>
  parseNumberField(record[key], fallback);

const rowStr = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? '');

const parseTimeline = (raw: string): DealTimelineEntry[] => {
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

const serializeTimeline = (timeline: DealTimelineEntry[] | undefined): string =>
  JSON.stringify(Array.isArray(timeline) ? timeline : []);

export const dealMapper = createBaseEntityMapper<DealEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    dealNumber: str(record, 'dealNumber'),
    title: str(record, 'title'),
    customerId: str(record, 'customerId'),
    customerName: str(record, 'customerName'),
    status: (str(record, 'status', 'draft') as DealEntity['status']),
    currentStageId: str(record, 'currentStageId'),
    dealType: str(record, 'dealType'),
    contractValue: num(record, 'contractValue'),
    currency: str(record, 'currency', 'INR'),
    probability: num(record, 'probability'),
    startDate: str(record, 'startDate'),
    expectedCloseDate: str(record, 'expectedCloseDate'),
    actualCloseDate: str(record, 'actualCloseDate'),
    nextRenewal: str(record, 'nextRenewal'),
    renewalFrequency: (str(record, 'renewalFrequency', 'none') as DealEntity['renewalFrequency']),
    nextActionDate: str(record, 'nextActionDate'),
    owner: str(record, 'owner'),
    description: str(record, 'description'),
    notes: str(record, 'notes'),
    componentsCount: num(record, 'componentsCount'),
    timeline: parseTimeline(str(record, 'timeline')),
  }),
  (entity) => ({
    dealNumber: rowStr(entity, 'dealNumber'),
    title: rowStr(entity, 'title'),
    customerId: rowStr(entity, 'customerId'),
    customerName: rowStr(entity, 'customerName'),
    status: rowStr(entity, 'status'),
    currentStageId: rowStr(entity, 'currentStageId'),
    dealType: rowStr(entity, 'dealType'),
    contractValue: String(entity.contractValue ?? 0),
    currency: rowStr(entity, 'currency'),
    probability: String(entity.probability ?? 0),
    startDate: rowStr(entity, 'startDate'),
    expectedCloseDate: rowStr(entity, 'expectedCloseDate'),
    actualCloseDate: rowStr(entity, 'actualCloseDate'),
    nextRenewal: rowStr(entity, 'nextRenewal'),
    renewalFrequency: rowStr(entity, 'renewalFrequency'),
    nextActionDate: rowStr(entity, 'nextActionDate'),
    owner: rowStr(entity, 'owner'),
    description: rowStr(entity, 'description'),
    notes: rowStr(entity, 'notes'),
    componentsCount: String(entity.componentsCount ?? 0),
    timeline: serializeTimeline(entity.timeline),
  }),
);

export const dealComponentMapper = createBaseEntityMapper<DealComponentEntity>(  (record, base) => ({
    ...base,
    dealId: str(record, 'dealId'),
    name: str(record, 'name'),
    category: str(record, 'category'),
    description: str(record, 'description'),
    amount: num(record, 'amount'),
    billingType: (str(record, 'billingType', 'one-time') as DealComponentEntity['billingType']),
    status: (str(record, 'status', 'pending') as DealComponentEntity['status']),
    renewalDate: str(record, 'renewalDate'),
  }),
  (entity) => ({
    dealId: rowStr(entity, 'dealId'),
    name: rowStr(entity, 'name'),
    category: rowStr(entity, 'category'),
    description: rowStr(entity, 'description'),
    amount: String(entity.amount ?? 0),
    billingType: rowStr(entity, 'billingType'),
    status: rowStr(entity, 'status'),
    renewalDate: rowStr(entity, 'renewalDate'),
  }),
);
