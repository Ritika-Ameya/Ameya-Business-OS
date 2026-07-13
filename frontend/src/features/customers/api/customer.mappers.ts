import type { Customer, CustomerFormData } from "@/features/customers/types/customer";
import type { CustomerCreateBody, CustomerDto } from "@/features/customers/api/customer.dto";

export function mapCustomerFromDto(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    name: dto.contactPerson,
    company: dto.companyName,
    phone: dto.phone,
    email: dto.email,
    gst: dto.gstin || undefined,
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

export function mapFormToCreateBody(data: CustomerFormData): CustomerCreateBody {
  return {
    recordType: data.recordType,
    contactPerson: data.name.trim(),
    companyName: data.company.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    gstin: data.gst.trim().toUpperCase(),
    billingAddress: data.billingAddress.trim(),
    serviceAddress: data.serviceAddress.trim(),
    notes: data.notes.trim(),
  };
}

export function mapFormToUpdateBody(data: CustomerFormData): CustomerCreateBody {
  return mapFormToCreateBody(data);
}
