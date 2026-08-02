import type { Customer, CustomerFormData } from "@/features/customers/types/customer";
import type { CustomerCreateBody, CustomerDto } from "@/features/customers/api/customer.dto";
import { normalizePhoneToE164 } from "@/shared/utils/phone";

const toPhoneForTransport = (value: string): string => {
  const normalized = normalizePhoneToE164(value, { required: true });
  return normalized === "__INVALID__" ? value.trim() : normalized;
};

export function mapCustomerFromDto(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    name: dto.contactPerson,
    company: dto.companyName,
    phone: dto.phone,
    email: dto.email,
    gst: dto.gstin || undefined,
    vatId: dto.vatId || undefined,
    licenseNo: dto.licenseNo || undefined,
    billingAddress: dto.billingAddress || undefined,
    serviceAddress: dto.serviceAddress || undefined,
    address: dto.billingAddress || undefined,
    notes: dto.notes || undefined,
    status: dto.status,
    recordType: dto.recordType,
    currentStageId: dto.currentStageId || undefined,
    nextActionDate: dto.nextActionDate || undefined,
    timeline: Array.isArray(dto.timeline) ? dto.timeline : [],
    outstanding: dto.outstandingAmount ?? 0,
    activeDeals: dto.activeDeals ?? 0,
    nextRenewal: dto.renewalDate || undefined,
    businessSince: dto.businessSince || dto.createdAt?.split("T")[0],
    lastPayment: dto.lastPayment || undefined,
    businessValue: dto.businessValue ?? 0,
    createdAt: dto.createdAt?.split("T")[0] ?? dto.createdAt,
  };
}

export function mapFormToCreateBody(
  data: CustomerFormData,
  options?: { allowDuplicateCompanyName?: boolean }
): CustomerCreateBody {
  return {
    recordType: data.recordType,
    contactPerson: data.name.trim(),
    companyName: data.company.trim(),
    phone: toPhoneForTransport(data.phone),
    email: data.email.trim(),
    gstin: data.gst.trim().toUpperCase(),
    vatId: data.vatId.trim(),
    licenseNo: data.licenseNo.trim(),
    billingAddress: data.billingAddress.trim(),
    serviceAddress: data.serviceAddress.trim(),
    notes: data.notes.trim(),
    allowDuplicateCompanyName: options?.allowDuplicateCompanyName || undefined,
  };
}

export function mapFormToUpdateBody(
  data: CustomerFormData,
  options?: { allowDuplicateCompanyName?: boolean }
): CustomerCreateBody {
  return mapFormToCreateBody(data, options);
}
