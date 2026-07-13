import type { BaseEntity } from '../../../types';
import type {
  CustomerRecordType,
  CustomerStatus,
  CustomerTimelineEntry,
} from '../../../types/entity.contracts';

export type {
  CustomerRecordType,
  CustomerStatus,
  CustomerTimelineEntry,
  DocumentEntity as DocumentContractEntity,
} from '../../../types/entity.contracts';

export type CustomerEntityBase = BaseEntity & Record<string, unknown>;

/** Sheet-backed customer/opportunity entity (index signature for repository generics). */
export interface CustomerEntity extends CustomerEntityBase {
  recordType: CustomerRecordType;
  status: CustomerStatus;
  currentStageId: string;
  companyName: string;
  gstin: string;
  industryId: string;
  sourceId: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  website: string;
  billingAddress: string;
  serviceAddress: string;
  countryId: string;
  stateId: string;
  city: string;
  pincode: string;
  notes: string;
  businessValue: number;
  expectedRevenue: number;
  nextActionDate: string;
  lastContactDate: string;
  renewalDate: string;
  outstandingAmount: number;
  tags: string[];
  isActive: boolean;
  timeline: CustomerTimelineEntry[];
  activeDeals: number;
  lastPayment: string;
  businessSince: string;
}

export interface DocumentEntity extends CustomerEntityBase {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export type TimelineAction =
  | 'created'
  | 'edited'
  | 'stage_changed'
  | 'converted_to_customer'
  | 'notes_added'
  | 'file_uploaded'
  | 'deal_created'
  | 'invoice_generated'
  | 'payment_recorded';

export type SearchMode = 'contains' | 'startsWith' | 'exact';

export const CUSTOMER_SEARCH_FIELDS = [
  'companyName',
  'gstin',
  'phone',
  'email',
  'contactPerson',
] as const;

export type CustomerSearchField = (typeof CUSTOMER_SEARCH_FIELDS)[number];

export const TIMELINE_ACTION_LABELS: Record<TimelineAction, string> = {
  created: 'Created',
  edited: 'Edited',
  stage_changed: 'Stage Changed',
  converted_to_customer: 'Converted to Customer',
  notes_added: 'Notes Added',
  file_uploaded: 'File Uploaded',
  deal_created: 'Deal Created',
  invoice_generated: 'Invoice Generated',
  payment_recorded: 'Payment Recorded',
};
