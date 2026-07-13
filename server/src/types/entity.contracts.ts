import type { BaseEntity } from './entity.types';

/** Entity contracts for Data Model v1.0 — used by future business repositories */

export interface CompanyEntity extends BaseEntity {
  name: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UserEntity extends BaseEntity {
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt?: string;
}

export type CustomerRecordType = 'opportunity' | 'customer';
export type CustomerStatus = 'active' | 'inactive' | 'prospect';

export interface CustomerTimelineEntry {
  id: string;
  action?: string;
  stageId?: string;
  stageName: string;
  notes?: string;
  nextActionDate?: string;
  timestamp: string;
}

/** One domain model for Opportunity → Customer lifecycle (recordType discriminator). */
export interface CustomerEntity extends BaseEntity {
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

export interface DealEntity extends BaseEntity {
  title: string;
  customerId: string;
  stage: string;
  value: number;
  currency: string;
  expectedCloseDate?: string;
  assignedTo?: string;
}

export interface DealComponentEntity extends BaseEntity {
  dealId: string;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceEntity extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  dealId?: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface PaymentEntity extends BaseEntity {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string;
  reference?: string;
}

export interface ExpenseEntity extends BaseEntity {
  description: string;
  category: string;
  amount: number;
  currency: string;
  expenseDate: string;
  vendor?: string;
  status: string;
  receiptDocumentId?: string;
}

export interface RenewalEntity extends BaseEntity {
  customerId: string;
  dealId?: string;
  renewalDate: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
}

export interface DocumentEntity extends BaseEntity {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export interface ActivityLogEntity extends BaseEntity {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  details?: string;
  occurredAt: string;
}

export interface SettingEntity extends BaseEntity {
  key: string;
  value: string;
  category: string;
  description?: string;
  isSystem: boolean;
}
