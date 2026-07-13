import type { BaseEntity } from '../../../types';
import type {
  DealBillingType,
  DealComponentStatus,
  DealRenewalFrequency,
  DealStatus,
  DealTimelineEntry,
} from '../../../types/entity.contracts';

export type {
  DealBillingType,
  DealComponentStatus,
  DealRenewalFrequency,
  DealStatus,
  DealTimelineEntry,
} from '../../../types/entity.contracts';

export type DealEntityBase = BaseEntity & Record<string, unknown>;

export interface DealEntity extends DealEntityBase {
  dealNumber: string;
  title: string;
  customerId: string;
  customerName: string;
  status: DealStatus;
  currentStageId: string;
  dealType: string;
  contractValue: number;
  currency: string;
  probability: number;
  startDate: string;
  expectedCloseDate: string;
  actualCloseDate: string;
  nextRenewal: string;
  renewalFrequency: DealRenewalFrequency;
  nextActionDate: string;
  owner: string;
  description: string;
  notes: string;
  componentsCount: number;
  timeline: DealTimelineEntry[];
}

export interface DealComponentEntity extends DealEntityBase {
  dealId: string;
  name: string;
  category: string;
  description: string;
  amount: number;
  billingType: DealBillingType;
  status: DealComponentStatus;
  renewalDate: string;
}

export type DealTimelineAction =
  | 'created'
  | 'updated'
  | 'stage_changed'
  | 'status_changed'
  | 'value_changed'
  | 'component_added'
  | 'component_removed'
  | 'document_linked'
  | 'renewal_updated'
  | 'notes_added';

export type DealSearchMode = 'contains' | 'startsWith' | 'exact';

export const DEAL_SEARCH_FIELDS = [
  'dealNumber',
  'title',
  'customerName',
  'owner',
  'description',
] as const;

export type DealSearchField = (typeof DEAL_SEARCH_FIELDS)[number];

export const DEAL_TIMELINE_ACTION_LABELS: Record<DealTimelineAction, string> = {
  created: 'Deal Created',
  updated: 'Deal Updated',
  stage_changed: 'Stage Changed',
  status_changed: 'Status Changed',
  value_changed: 'Value Changed',
  component_added: 'Component Added',
  component_removed: 'Component Removed',
  document_linked: 'Document Linked',
  renewal_updated: 'Renewal Updated',
  notes_added: 'Notes Added',
};
