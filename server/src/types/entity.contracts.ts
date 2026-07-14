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

export type DealStatus = 'draft' | 'active' | 'completed' | 'on-hold';
export type DealRenewalFrequency = 'none' | 'monthly' | 'quarterly' | 'annual';

export interface DealTimelineEntry {
  id: string;
  action?: string;
  stageId?: string;
  stageName: string;
  notes?: string;
  nextActionDate?: string;
  timestamp: string;
}

export interface DealEntity extends BaseEntity {
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

export type DealBillingType =
  | 'one-time'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly';

export type DealComponentStatus = 'pending' | 'in-progress' | 'completed';

export interface DealComponentEntity extends BaseEntity {
  dealId: string;
  name: string;
  category: string;
  description: string;
  amount: number;
  billingType: DealBillingType;
  status: DealComponentStatus;
  renewalDate: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';

export interface InvoiceTimelineEntry {
  id: string;
  action?: string;
  stageName: string;
  notes?: string;
  timestamp: string;
}

export interface InvoiceEntity extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxPercent: number;
  tax: number;
  total: number;
  currency: string;
  received: number;
  outstanding: number;
  componentIds: string[];
  notes: string;
  timeline: InvoiceTimelineEntry[];
}

export type PaymentStatus = 'received' | 'pending' | 'failed';

export interface PaymentEntity extends BaseEntity {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  paidAt: string;
  reference: string;
  receivedBy: string;
  transactionId: string;
  notes: string;
}

export type ExpenseTransactionStatus = 'paid' | 'pending' | 'partial' | 'cancelled';
export type ExpensePayeeType = 'vendor' | 'employee';
export type ExpenseMasterStatus = 'active' | 'inactive';
export type ExpenseFrequency =
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly'
  | 'one-time';

export interface ExpenseEntity extends BaseEntity {
  expenseDate: string;
  name: string;
  categoryId: string;
  categoryName: string;
  payeeType: ExpensePayeeType;
  vendorOrEmployee: string;
  vendorId: string;
  employeeId: string;
  amount: number;
  currency: string;
  status: ExpenseTransactionStatus;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  hasAttachment: boolean;
  recurring: boolean;
  masterTemplateId: string;
  generatedPeriod: string;
}

export interface ExpenseMasterEntity extends BaseEntity {
  name: string;
  categoryId: string;
  categoryName: string;
  payeeType: ExpensePayeeType;
  vendorOrEmployee: string;
  vendorId: string;
  employeeId: string;
  defaultAmount: number;
  frequency: ExpenseFrequency;
  startDate: string;
  endDate: string;
  autoGenerate: boolean;
  status: ExpenseMasterStatus;
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
