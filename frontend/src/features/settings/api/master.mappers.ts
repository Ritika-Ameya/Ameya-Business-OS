import type {
  BrandingSettings,
  CompanySettings,
  DealTypeFormData,
  ExpenseCategoryFormData,
  FinanceSettings,
  IndustryFormData,
  OpportunitySourceFormData,
  PaymentMethodFormData,
  RenewalTypeFormData,
  SettingsCountry,
  SettingsDealType,
  SettingsEntityStatus,
  SettingsExpenseCategory,
  SettingsIndustry,
  SettingsOpportunitySource,
  SettingsPaymentMethod,
  SettingsRenewalType,
  SettingsStage,
  SettingsState,
  StageFormData,
  CountryFormData,
  StateFormData,
} from "@/features/settings/types/settings";
import type {
  BrandingDto,
  CompanyMasterDto,
  CountryMasterDto,
  InvoiceConfigurationDto,
  NamedMasterDto,
  SimpleMasterDto,
  SlugMasterDto,
  StageMasterDto,
  StateMasterDto,
} from "@/features/settings/api/master.dto";
import { slugifyName } from "@/features/settings/utils/app-config-utils";

export const toFrontendStatus = (isActive: boolean): SettingsEntityStatus =>
  isActive ? "active" : "inactive";

export const toBackendActive = (status: SettingsEntityStatus): boolean =>
  status === "active";

export const mapCompanyFromDto = (dto: CompanyMasterDto): CompanySettings => ({
  companyName: dto.companyName,
  gstin: dto.gstin,
  pan: dto.pan,
  email: dto.email,
  phone: dto.phone,
  website: dto.website,
  address: dto.address,
  currency: dto.currency,
  financialYear: dto.financialYear,
});

export const mapCompanyToDto = (data: CompanySettings): Omit<CompanyMasterDto, keyof import("@/shared/api/types").BaseEntityDto> => ({
  companyName: data.companyName,
  gstin: data.gstin,
  pan: data.pan,
  email: data.email,
  phone: data.phone,
  website: data.website,
  address: data.address,
  currency: data.currency,
  financialYear: data.financialYear,
});

export const mapFinanceFromDto = (dto: InvoiceConfigurationDto): FinanceSettings => ({
  invoicePrefix: dto.invoicePrefix,
  nextInvoiceNumber: dto.nextInvoiceNumber,
  defaultTaxPercentage: dto.defaultTaxPercentage,
  defaultPaymentTerms: dto.defaultPaymentTerms,
  currencySymbol: dto.currencySymbol,
});

export const mapFinanceToDto = (
  data: FinanceSettings
): Omit<InvoiceConfigurationDto, keyof import("@/shared/api/types").BaseEntityDto> => ({
  invoicePrefix: data.invoicePrefix,
  nextInvoiceNumber: data.nextInvoiceNumber,
  defaultTaxPercentage: data.defaultTaxPercentage,
  defaultPaymentTerms: data.defaultPaymentTerms,
  currencySymbol: data.currencySymbol,
});

export const mapBrandingFromDto = (dto: BrandingDto): BrandingSettings => ({
  logoUrl: dto.logoUrl,
  faviconUrl: dto.faviconUrl,
  primaryColor: dto.primaryColor,
  secondaryColor: dto.secondaryColor,
  accentColor: dto.accentColor,
  tagline: dto.tagline,
});

export const mapBrandingToDto = (
  data: BrandingSettings
): Omit<BrandingDto, keyof import("@/shared/api/types").BaseEntityDto> => ({
  logoUrl: data.logoUrl,
  faviconUrl: data.faviconUrl,
  primaryColor: data.primaryColor,
  secondaryColor: data.secondaryColor,
  accentColor: data.accentColor,
  tagline: data.tagline,
});

export const mapStageFromDto = (dto: StageMasterDto): SettingsStage => ({
  id: dto.id,
  name: dto.name,
  color: dto.color,
  sequence: dto.sequence,
  applicableFor: dto.applicableFor,
  dateRequired: dto.dateRequired,
  notesRequired: dto.notesRequired,
  reminderOffset: dto.reminderOffset,
  status: toFrontendStatus(dto.isActive),
});

export const mapStageToDto = (data: StageFormData) => ({
  name: data.name.trim(),
  sequence: data.sequence,
  color: data.color,
  applicableFor: data.applicableFor,
  dateRequired: data.dateRequired,
  notesRequired: data.notesRequired,
  reminderOffset: data.reminderOffset,
  canConvertToCustomer:
    data.applicableFor === "customer" || data.applicableFor === "both",
  isActive: toBackendActive(data.status),
});

export const mapOpportunitySourceFromDto = (
  dto: NamedMasterDto
): SettingsOpportunitySource => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  status: toFrontendStatus(dto.isActive),
});

export const mapOpportunitySourceToDto = (data: OpportunitySourceFormData) => ({
  name: data.name.trim(),
  description: data.description.trim(),
  isActive: toBackendActive(data.status),
});

export const mapIndustryFromDto = (dto: NamedMasterDto): SettingsIndustry => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  status: toFrontendStatus(dto.isActive),
});

export const mapIndustryToDto = (data: IndustryFormData) => ({
  name: data.name.trim(),
  description: data.description.trim(),
  isActive: toBackendActive(data.status),
});

export const mapExpenseCategoryFromDto = (
  dto: NamedMasterDto
): SettingsExpenseCategory => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  status: toFrontendStatus(dto.isActive),
});

export const mapExpenseCategoryToDto = (data: ExpenseCategoryFormData) => ({
  name: data.name.trim(),
  description: data.description.trim(),
  isActive: toBackendActive(data.status),
});

export const mapRenewalTypeFromDto = (dto: SimpleMasterDto): SettingsRenewalType => ({
  id: dto.id,
  name: dto.name,
  status: toFrontendStatus(dto.isActive),
});

export const mapRenewalTypeToDto = (data: RenewalTypeFormData) => ({
  name: data.name.trim(),
  isActive: toBackendActive(data.status),
});

export const mapPaymentMethodFromDto = (dto: SlugMasterDto): SettingsPaymentMethod => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug,
  status: toFrontendStatus(dto.isActive),
});

export const mapPaymentMethodToDto = (data: PaymentMethodFormData) => ({
  name: data.name.trim(),
  slug: data.slug.trim() || slugifyName(data.name),
  isActive: toBackendActive(data.status),
});

export const mapDealTypeFromDto = (dto: SlugMasterDto): SettingsDealType => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug,
  status: toFrontendStatus(dto.isActive),
});

export const mapDealTypeToDto = (data: DealTypeFormData) => ({
  name: data.name.trim(),
  slug: data.slug.trim() || slugifyName(data.name),
  isActive: toBackendActive(data.status),
});

export const mapCountryFromDto = (dto: CountryMasterDto): SettingsCountry => ({
  id: dto.id,
  name: dto.name,
  code: dto.code,
  status: toFrontendStatus(dto.isActive),
});

export const mapCountryToDto = (data: CountryFormData) => ({
  name: data.name.trim(),
  code: data.code.trim().toUpperCase(),
  isActive: toBackendActive(data.status),
});

export const mapStateFromDto = (dto: StateMasterDto): SettingsState => ({
  id: dto.id,
  name: dto.name,
  code: dto.code,
  countryId: dto.countryId,
  status: toFrontendStatus(dto.isActive),
});

export const mapStateToDto = (data: StateFormData) => ({
  name: data.name.trim(),
  code: data.code.trim().toUpperCase(),
  countryId: data.countryId,
  isActive: toBackendActive(data.status),
});
