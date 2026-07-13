import type {
  Deal,
  DealFormData,
  RenewalFrequency,
} from "@/features/deals/types/deal";
import type {
  ComponentFormData,
  DealComponent,
} from "@/features/deals/types/deal-component";
import type {
  DealComponentCreateBody,
  DealComponentDto,
  DealCreateBody,
  DealDto,
} from "@/features/deals/api/deal.dto";

export function mapDealFromDto(dto: DealDto): Deal {
  return {
    id: dto.id,
    title: dto.title,
    customerId: dto.customerId,
    customerName: dto.customerName,
    status: dto.status,
    startDate: dto.startDate,
    nextRenewal: dto.nextRenewal || undefined,
    currentStageId: dto.currentStageId || undefined,
    nextActionDate: dto.nextActionDate || undefined,
    timeline: Array.isArray(dto.timeline) ? dto.timeline : [],
    componentsCount: dto.componentsCount ?? 0,
    dealType: dto.dealType || undefined,
    contractValue: dto.contractValue,
    renewalFrequency: dto.renewalFrequency || undefined,
    description: dto.description || undefined,
    notes: dto.notes || undefined,
    dealNumber: dto.dealNumber || undefined,
    currency: dto.currency || undefined,
    probability: dto.probability,
    owner: dto.owner || undefined,
    expectedCloseDate: dto.expectedCloseDate || undefined,
  };
}

export function mapComponentFromDto(dto: DealComponentDto): DealComponent {
  return {
    id: dto.id,
    dealId: dto.dealId,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    amount: dto.amount,
    billingType: dto.billingType,
    status: dto.status,
    renewalDate: dto.renewalDate || undefined,
  };
}

export function mapFormToCreateBody(
  data: DealFormData & { customerId: string; customerName: string }
): DealCreateBody {
  return {
    title: data.title.trim(),
    customerId: data.customerId,
    customerName: data.customerName,
    dealType: data.dealType,
    contractValue: Number.parseFloat(data.contractValue.replace(/,/g, "")) || 0,
    startDate: data.startDate,
    renewalFrequency: data.renewalFrequency as RenewalFrequency,
    description: data.description.trim(),
    status: "draft",
  };
}

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mapComponentFormToBody(data: ComponentFormData): DealComponentCreateBody {
  return {
    name: data.name.trim(),
    category: data.category.trim(),
    description: data.description.trim(),
    amount: parseAmount(data.amount),
    billingType: data.billingType,
    status: data.status,
    renewalDate: data.renewalApplicable ? data.renewalDate : "",
  };
}
