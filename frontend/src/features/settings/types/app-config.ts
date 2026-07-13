import type {
  BrandingFormData,
  BrandingSettings,
  CompanySettings,
  CountryFormData,
  DealTypeFormData,
  EmployeeFormData,
  ExpenseCategoryFormData,
  FinanceSettings,
  IndustryFormData,
  OpportunitySourceFormData,
  PaymentMethodFormData,
  PreferencesSettings,
  RenewalTypeFormData,
  SettingsCountry,
  SettingsDealType,
  SettingsEmployee,
  SettingsExpenseCategory,
  SettingsIndustry,
  SettingsOpportunitySource,
  SettingsPaymentMethod,
  SettingsRenewalType,
  SettingsStage,
  SettingsState,
  SettingsVendor,
  StageFormData,
  StateFormData,
  VendorFormData,
} from "@/features/settings/types/settings";

export interface AppConfigState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  company: CompanySettings;
  finance: FinanceSettings;
  branding: BrandingSettings;
  preferences: PreferencesSettings;
  opportunitySources: SettingsOpportunitySource[];
  industries: SettingsIndustry[];
  stages: SettingsStage[];
  dealTypes: SettingsDealType[];
  paymentMethods: SettingsPaymentMethod[];
  expenseCategories: SettingsExpenseCategory[];
  renewalTypes: SettingsRenewalType[];
  countries: SettingsCountry[];
  states: SettingsState[];
  employees: SettingsEmployee[];
  vendors: SettingsVendor[];
}

export interface AppConfigActions {
  clearMessages: () => void;
  refreshSettings: () => Promise<void>;
  updateCompany: (data: CompanySettings) => Promise<void>;
  updateFinance: (data: FinanceSettings) => Promise<void>;
  updateBranding: (data: BrandingFormData) => Promise<void>;
  updatePreferences: (data: PreferencesSettings) => void;
  addOpportunitySource: (data: OpportunitySourceFormData) => Promise<SettingsOpportunitySource>;
  updateOpportunitySource: (id: string, data: OpportunitySourceFormData) => Promise<void>;
  deleteOpportunitySource: (id: string) => Promise<void>;
  addIndustry: (data: IndustryFormData) => Promise<SettingsIndustry>;
  updateIndustry: (id: string, data: IndustryFormData) => Promise<void>;
  deleteIndustry: (id: string) => Promise<void>;
  addStage: (data: StageFormData) => Promise<SettingsStage>;
  updateStage: (id: string, data: StageFormData) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  addDealType: (data: DealTypeFormData) => Promise<SettingsDealType>;
  updateDealType: (id: string, data: DealTypeFormData) => Promise<void>;
  deleteDealType: (id: string) => Promise<void>;
  addPaymentMethod: (data: PaymentMethodFormData) => Promise<SettingsPaymentMethod>;
  updatePaymentMethod: (id: string, data: PaymentMethodFormData) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addExpenseCategory: (data: ExpenseCategoryFormData) => Promise<SettingsExpenseCategory>;
  updateExpenseCategory: (id: string, data: ExpenseCategoryFormData) => Promise<void>;
  deleteExpenseCategory: (id: string) => Promise<void>;
  addRenewalType: (data: RenewalTypeFormData) => Promise<SettingsRenewalType>;
  updateRenewalType: (id: string, data: RenewalTypeFormData) => Promise<void>;
  deleteRenewalType: (id: string) => Promise<void>;
  addCountry: (data: CountryFormData) => Promise<SettingsCountry>;
  updateCountry: (id: string, data: CountryFormData) => Promise<void>;
  deleteCountry: (id: string) => Promise<void>;
  addState: (data: StateFormData) => Promise<SettingsState>;
  updateState: (id: string, data: StateFormData) => Promise<void>;
  deleteState: (id: string) => Promise<void>;
  addEmployee: (data: EmployeeFormData) => SettingsEmployee;
  updateEmployee: (id: string, data: EmployeeFormData) => void;
  addVendor: (data: VendorFormData) => SettingsVendor;
  updateVendor: (id: string, data: VendorFormData) => void;
}

export type AppConfigValue = AppConfigState & AppConfigActions;
