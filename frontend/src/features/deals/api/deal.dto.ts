import type { BaseEntityDto } from "@/shared/api/types";
import type {
  DealStatus,
  DealTimelineEntry,
  RenewalFrequency,
} from "@/features/deals/types/deal";
import type {
  BillingType,
  ComponentStatus,
} from "@/features/deals/types/deal-component";

export interface DealDto extends BaseEntityDto {
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
  renewalFrequency: RenewalFrequency;
  nextActionDate: string;
  owner: string;
  description: string;
  notes: string;
  componentsCount: number;
  timeline: DealTimelineEntry[];
}

export interface DealComponentDto extends BaseEntityDto {
  dealId: string;
  name: string;
  category: string;
  description: string;
  amount: number;
  billingType: BillingType;
  status: ComponentStatus;
  renewalDate: string;
}

export interface DealDocumentDto extends BaseEntityDto {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export interface DealCreateBody {
  title: string;
  customerId: string;
  customerName?: string;
  dealType: string;
  contractValue: number;
  startDate: string;
  renewalFrequency: RenewalFrequency;
  description?: string;
  status?: DealStatus;
  currency?: string;
  probability?: number;
  owner?: string;
  notes?: string;
}

export interface DealStageChangeBody {
  stageId: string;
  nextActionDate?: string;
  notes?: string;
}

export interface DealComponentCreateBody {
  name: string;
  category?: string;
  description?: string;
  amount: number;
  billingType: BillingType;
  status: ComponentStatus;
  renewalDate?: string;
}
