import type { Deal, DealFormData } from "@/features/deals/types/deal";
import type {
  ComponentFormData,
  ComponentRenewalFrequency,
  DealComponent,
} from "@/features/deals/types/deal-component";
import type {
  DealComponentCreateBody,
  DealComponentDto,
  DealCreateBody,
  DealDto,
} from "@/features/deals/api/deal.dto";
import { resolveComponentRenewalDate } from "@/features/deals/utils/deal-component-utils";

export function mapDealFromDto(dto: DealDto): Deal {
  return {
    id: dto.id,
    title: dto.title,
    customerId: dto.customerId,
    customerName: dto.customerName,
    status: dto.status,
    startDate: dto.startDate,
    currentStageId: dto.currentStageId || undefined,
    nextActionDate: dto.nextActionDate || undefined,
    timeline: Array.isArray(dto.timeline) ? dto.timeline : [],
    componentsCount: dto.componentsCount ?? 0,
    dealType: dto.dealType || undefined,
    contractValue: dto.contractValue,
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
    gstPercent: dto.gstPercent ?? 0,
    quantity: dto.quantity > 0 ? dto.quantity : 1,
    discount: dto.discount ?? 0,
    billingType: dto.billingType,
    status: dto.status,
    renewalFrequency: (dto.renewalFrequency || "none") as ComponentRenewalFrequency,
    renewalStartDate: dto.renewalStartDate || undefined,
    renewalDate: dto.renewalDate || undefined,
    lastRenewedDate: dto.lastRenewedDate || undefined,
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
    description: data.description.trim(),
    status: "draft",
  };
}

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mapComponentFormToBody(data: ComponentFormData): DealComponentCreateBody {
  const renewalFrequency = (data.renewalFrequency || "none") as ComponentRenewalFrequency;
  const renewalStartDate =
    renewalFrequency !== "none" ? data.renewalStartDate.trim() : "";
  const renewalDate = resolveComponentRenewalDate({
    renewalFrequency,
    renewalStartDate,
    renewalDate: data.renewalDate,
  });

  return {
    name: data.name.trim(),
    category: data.category.trim(),
    description: data.description.trim(),
    amount: parseAmount(data.amount),
    gstPercent: parseAmount(data.gstPercent),
    quantity: parseAmount(data.quantity) || 1,
    discount: parseAmount(data.discount),
    billingType: data.billingType,
    status: data.status,
    renewalFrequency,
    renewalStartDate,
    renewalDate,
  };
}
