import type { BaseEntityDto } from "@/shared/api/types";
import type {
  StageApplicableFor,
  StageReminderOffset,
} from "@/features/settings/types/settings";

export interface CompanyMasterDto extends BaseEntityDto {
  companyName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  currency: string;
  financialYear: string;
}

export interface StageMasterDto extends BaseEntityDto {
  name: string;
  sequence: number;
  color: string;
  applicableFor: StageApplicableFor;
  dateRequired: boolean;
  notesRequired: boolean;
  reminderOffset: StageReminderOffset;
  canConvertToCustomer: boolean;
  isActive: boolean;
}

export interface NamedMasterDto extends BaseEntityDto {
  name: string;
  description: string;
  isActive: boolean;
}

export interface SlugMasterDto extends BaseEntityDto {
  name: string;
  slug: string;
  isActive: boolean;
}

export interface SimpleMasterDto extends BaseEntityDto {
  name: string;
  isActive: boolean;
}

export interface CountryMasterDto extends BaseEntityDto {
  name: string;
  code: string;
  isActive: boolean;
}

export interface StateMasterDto extends BaseEntityDto {
  name: string;
  code: string;
  countryId: string;
  isActive: boolean;
}

export interface InvoiceConfigurationDto extends BaseEntityDto {
  invoicePrefix: string;
  nextInvoiceNumber: string;
  defaultTaxPercentage: string;
  defaultPaymentTerms: string;
  currencySymbol: string;
}

export interface BrandingDto extends BaseEntityDto {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
}
