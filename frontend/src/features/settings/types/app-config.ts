import type {
  CompanySettings,
  DealTypeFormData,
  EmployeeFormData,
  ExpenseCategoryFormData,
  FinanceSettings,
  PaymentMethodFormData,
  PreferencesSettings,
  RenewalTypeFormData,
  SettingsDealType,
  SettingsEmployee,
  SettingsExpenseCategory,
  SettingsPaymentMethod,
  SettingsRenewalType,
  SettingsStage,
  SettingsVendor,
  StageFormData,
  VendorFormData,
} from "@/features/settings/types/settings";

export interface AppConfigState {
  company: CompanySettings;
  finance: FinanceSettings;
  preferences: PreferencesSettings;
  employees: SettingsEmployee[];
  vendors: SettingsVendor[];
  expenseCategories: SettingsExpenseCategory[];
  renewalTypes: SettingsRenewalType[];
  paymentMethods: SettingsPaymentMethod[];
  dealTypes: SettingsDealType[];
  stages: SettingsStage[];
}

export interface AppConfigActions {
  updateCompany: (data: CompanySettings) => void;
  updateFinance: (data: FinanceSettings) => void;
  updatePreferences: (data: PreferencesSettings) => void;
  addEmployee: (data: EmployeeFormData) => SettingsEmployee;
  updateEmployee: (id: string, data: EmployeeFormData) => void;
  addVendor: (data: VendorFormData) => SettingsVendor;
  updateVendor: (id: string, data: VendorFormData) => void;
  addExpenseCategory: (data: ExpenseCategoryFormData) => SettingsExpenseCategory;
  updateExpenseCategory: (id: string, data: ExpenseCategoryFormData) => void;
  addRenewalType: (data: RenewalTypeFormData) => SettingsRenewalType;
  updateRenewalType: (id: string, data: RenewalTypeFormData) => void;
  addPaymentMethod: (data: PaymentMethodFormData) => SettingsPaymentMethod;
  updatePaymentMethod: (id: string, data: PaymentMethodFormData) => void;
  addDealType: (data: DealTypeFormData) => SettingsDealType;
  updateDealType: (id: string, data: DealTypeFormData) => void;
  addStage: (data: StageFormData) => SettingsStage;
  updateStage: (id: string, data: StageFormData) => void;
}

export type AppConfigValue = AppConfigState & AppConfigActions;
