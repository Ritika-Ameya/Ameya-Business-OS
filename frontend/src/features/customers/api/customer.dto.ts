import type { BaseEntityDto } from "@/shared/api/types";
import type {
  CustomerStatus,
  CustomerTimelineEntry,
  RecordType,
} from "@/features/customers/types/customer";

export interface CustomerDto extends BaseEntityDto {
  recordType: RecordType;
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

export interface CustomerDocumentDto extends BaseEntityDto {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export interface CustomerCreateBody {
  recordType: RecordType;
  contactPerson: string;
  companyName?: string;
  phone: string;
  email?: string;
  gstin?: string;
  billingAddress?: string;
  serviceAddress?: string;
  notes?: string;
  website?: string;
  alternatePhone?: string;
  industryId?: string;
  sourceId?: string;
  countryId?: string;
  stateId?: string;
  city?: string;
  pincode?: string;
}

export interface CustomerStageChangeBody {
  stageId: string;
  nextActionDate?: string;
  notes?: string;
}
