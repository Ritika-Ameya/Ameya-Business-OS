import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { mastersApi } from "@/features/settings/api/masters.api";
import {
  mapBrandingFromDto,
  mapBrandingToDto,
  mapCompanyFromDto,
  mapCompanyToDto,
  mapCountryFromDto,
  mapCountryToDto,
  mapDealTypeFromDto,
  mapDealTypeToDto,
  mapExpenseCategoryFromDto,
  mapExpenseCategoryToDto,
  mapFinanceFromDto,
  mapFinanceToDto,
  mapIndustryFromDto,
  mapIndustryToDto,
  mapOpportunitySourceFromDto,
  mapOpportunitySourceToDto,
  mapPaymentMethodFromDto,
  mapPaymentMethodToDto,
  mapRenewalTypeFromDto,
  mapRenewalTypeToDto,
  mapStageFromDto,
  mapStageToDto,
  mapStateFromDto,
  mapStateToDto,
} from "@/features/settings/api/master.mappers";
import {
  defaultBrandingSettings,
  defaultCompanySettings,
  defaultFinanceSettings,
  defaultPreferencesSettings,
} from "@/features/settings/data/default-settings";
import {
  seedSettingsEmployees,
  seedSettingsVendors,
} from "@/features/settings/data/seed-settings";
import type { AppConfigValue } from "@/features/settings/types/app-config";
import type {
  BrandingFormData,
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

const PREFERENCES_KEY = "ameya-settings-preferences";
const EMPLOYEES_KEY = "ameya-settings-employees";
const VENDORS_KEY = "ameya-settings-vendors";

const AppConfigContext = createContext<AppConfigValue | null>(null);

export { AppConfigContext };

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // fall through
  }
  return fallback;
}

function persistJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanySettings>(defaultCompanySettings);
  const [finance, setFinance] = useState<FinanceSettings>(defaultFinanceSettings);
  const [branding, setBranding] = useState(defaultBrandingSettings);
  const [preferences, setPreferences] = useState<PreferencesSettings>(() =>
    loadJson(PREFERENCES_KEY, defaultPreferencesSettings)
  );
  const [opportunitySources, setOpportunitySources] = useState<SettingsOpportunitySource[]>([]);
  const [industries, setIndustries] = useState<SettingsIndustry[]>([]);
  const [stages, setStages] = useState<SettingsStage[]>([]);
  const [dealTypes, setDealTypes] = useState<SettingsDealType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SettingsPaymentMethod[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<SettingsExpenseCategory[]>([]);
  const [renewalTypes, setRenewalTypes] = useState<SettingsRenewalType[]>([]);
  const [countries, setCountries] = useState<SettingsCountry[]>([]);
  const [states, setStates] = useState<SettingsState[]>([]);
  const [employees, setEmployees] = useState<SettingsEmployee[]>(() =>
    loadJson(EMPLOYEES_KEY, seedSettingsEmployees)
  );
  const [vendors, setVendors] = useState<SettingsVendor[]>(() =>
    loadJson(VENDORS_KEY, seedSettingsVendors)
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const runSave = useCallback(async <T,>(action: () => Promise<T>, message: string): Promise<T> => {
    setSaving(true);
    clearMessages();
    try {
      const result = await action();
      setSuccessMessage(message);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }, [clearMessages]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const [
        companyDto,
        financeDto,
        brandingDto,
        stagesDto,
        opportunitySourcesDto,
        industriesDto,
        dealTypesDto,
        paymentMethodsDto,
        expenseCategoriesDto,
        renewalFrequenciesDto,
        countriesDto,
        statesDto,
      ] = await Promise.all([
        mastersApi.company.get(),
        mastersApi.invoiceConfiguration.get(),
        mastersApi.branding.get(),
        mastersApi.stages.list(),
        mastersApi.opportunitySources.list(),
        mastersApi.industries.list(),
        mastersApi.dealTypes.list(),
        mastersApi.paymentMethods.list(),
        mastersApi.expenseCategories.list(),
        mastersApi.renewalFrequencies.list(),
        mastersApi.countries.list(),
        mastersApi.states.list(),
      ]);

      setCompany(companyDto ? mapCompanyFromDto(companyDto) : defaultCompanySettings);
      setFinance(financeDto ? mapFinanceFromDto(financeDto) : defaultFinanceSettings);
      setBranding(brandingDto ? mapBrandingFromDto(brandingDto) : defaultBrandingSettings);
      setStages(stagesDto.map(mapStageFromDto).sort((a, b) => a.sequence - b.sequence));
      setOpportunitySources(opportunitySourcesDto.map(mapOpportunitySourceFromDto));
      setIndustries(industriesDto.map(mapIndustryFromDto));
      setDealTypes(dealTypesDto.map(mapDealTypeFromDto));
      setPaymentMethods(paymentMethodsDto.map(mapPaymentMethodFromDto));
      setExpenseCategories(expenseCategoriesDto.map(mapExpenseCategoryFromDto));
      setRenewalTypes(renewalFrequenciesDto.map(mapRenewalTypeFromDto));
      setCountries(countriesDto.map(mapCountryFromDto));
      setStates(statesDto.map(mapStateFromDto));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  useEffect(() => {
    // Initial load from backend on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void refreshSettings();
  }, [refreshSettings]);

  const updateCompany = useCallback(
    async (data: CompanySettings) => {
      await runSave(async () => {
        const saved = await mastersApi.company.save(mapCompanyToDto(data));
        setCompany(mapCompanyFromDto(saved));
      }, "Company settings saved.");
    },
    [runSave]
  );

  const updateFinance = useCallback(
    async (data: FinanceSettings) => {
      await runSave(async () => {
        const saved = await mastersApi.invoiceConfiguration.save(mapFinanceToDto(data));
        setFinance(mapFinanceFromDto(saved));
      }, "Invoice configuration saved.");
    },
    [runSave]
  );

  const updateBranding = useCallback(
    async (data: BrandingFormData) => {
      await runSave(async () => {
        const saved = await mastersApi.branding.save(mapBrandingToDto(data));
        setBranding(mapBrandingFromDto(saved));
      }, "Branding settings saved.");
    },
    [runSave]
  );

  const updatePreferences = useCallback((data: PreferencesSettings) => {
    setPreferences(data);
    persistJson(PREFERENCES_KEY, data);
    setSuccessMessage("Preferences saved locally.");
  }, []);

  const addStage = useCallback(
    async (data: StageFormData) =>
      runSave(async () => {
        const created = await mastersApi.stages.create(mapStageToDto(data));
        const mapped = mapStageFromDto(created);
        setStages((prev) => [...prev, mapped].sort((a, b) => a.sequence - b.sequence));
        return mapped;
      }, "Stage created."),
    [runSave]
  );

  const updateStage = useCallback(
    async (id: string, data: StageFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.stages.update(id, mapStageToDto(data));
        const mapped = mapStageFromDto(updated);
        setStages((prev) =>
          prev.map((item) => (item.id === id ? mapped : item)).sort((a, b) => a.sequence - b.sequence)
        );
      }, "Stage updated.");
    },
    [runSave]
  );

  const deleteStage = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.stages.delete(id);
        setStages((prev) => prev.filter((item) => item.id !== id));
      }, "Stage deleted.");
    },
    [runSave]
  );

  const addOpportunitySource = useCallback(
    async (data: OpportunitySourceFormData) =>
      runSave(async () => {
        const created = await mastersApi.opportunitySources.create(mapOpportunitySourceToDto(data));
        const mapped = mapOpportunitySourceFromDto(created);
        setOpportunitySources((prev) => [mapped, ...prev]);
        return mapped;
      }, "Opportunity source created."),
    [runSave]
  );

  const updateOpportunitySource = useCallback(
    async (id: string, data: OpportunitySourceFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.opportunitySources.update(id, mapOpportunitySourceToDto(data));
        const mapped = mapOpportunitySourceFromDto(updated);
        setOpportunitySources((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Opportunity source updated.");
    },
    [runSave]
  );

  const deleteOpportunitySource = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.opportunitySources.delete(id);
        setOpportunitySources((prev) => prev.filter((item) => item.id !== id));
      }, "Opportunity source deleted.");
    },
    [runSave]
  );

  const addIndustry = useCallback(
    async (data: IndustryFormData) =>
      runSave(async () => {
        const created = await mastersApi.industries.create(mapIndustryToDto(data));
        const mapped = mapIndustryFromDto(created);
        setIndustries((prev) => [mapped, ...prev]);
        return mapped;
      }, "Industry created."),
    [runSave]
  );

  const updateIndustry = useCallback(
    async (id: string, data: IndustryFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.industries.update(id, mapIndustryToDto(data));
        const mapped = mapIndustryFromDto(updated);
        setIndustries((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Industry updated.");
    },
    [runSave]
  );

  const deleteIndustry = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.industries.delete(id);
        setIndustries((prev) => prev.filter((item) => item.id !== id));
      }, "Industry deleted.");
    },
    [runSave]
  );

  const addDealType = useCallback(
    async (data: DealTypeFormData) =>
      runSave(async () => {
        const created = await mastersApi.dealTypes.create(mapDealTypeToDto(data));
        const mapped = mapDealTypeFromDto(created);
        setDealTypes((prev) => [mapped, ...prev]);
        return mapped;
      }, "Deal type created."),
    [runSave]
  );

  const updateDealType = useCallback(
    async (id: string, data: DealTypeFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.dealTypes.update(id, mapDealTypeToDto(data));
        const mapped = mapDealTypeFromDto(updated);
        setDealTypes((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Deal type updated.");
    },
    [runSave]
  );

  const deleteDealType = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.dealTypes.delete(id);
        setDealTypes((prev) => prev.filter((item) => item.id !== id));
      }, "Deal type deleted.");
    },
    [runSave]
  );

  const addPaymentMethod = useCallback(
    async (data: PaymentMethodFormData) =>
      runSave(async () => {
        const created = await mastersApi.paymentMethods.create(mapPaymentMethodToDto(data));
        const mapped = mapPaymentMethodFromDto(created);
        setPaymentMethods((prev) => [mapped, ...prev]);
        return mapped;
      }, "Payment method created."),
    [runSave]
  );

  const updatePaymentMethod = useCallback(
    async (id: string, data: PaymentMethodFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.paymentMethods.update(id, mapPaymentMethodToDto(data));
        const mapped = mapPaymentMethodFromDto(updated);
        setPaymentMethods((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Payment method updated.");
    },
    [runSave]
  );

  const deletePaymentMethod = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.paymentMethods.delete(id);
        setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
      }, "Payment method deleted.");
    },
    [runSave]
  );

  const addExpenseCategory = useCallback(
    async (data: ExpenseCategoryFormData) =>
      runSave(async () => {
        const created = await mastersApi.expenseCategories.create(mapExpenseCategoryToDto(data));
        const mapped = mapExpenseCategoryFromDto(created);
        setExpenseCategories((prev) => [mapped, ...prev]);
        return mapped;
      }, "Expense category created."),
    [runSave]
  );

  const updateExpenseCategory = useCallback(
    async (id: string, data: ExpenseCategoryFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.expenseCategories.update(id, mapExpenseCategoryToDto(data));
        const mapped = mapExpenseCategoryFromDto(updated);
        setExpenseCategories((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Expense category updated.");
    },
    [runSave]
  );

  const deleteExpenseCategory = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.expenseCategories.delete(id);
        setExpenseCategories((prev) => prev.filter((item) => item.id !== id));
      }, "Expense category deleted.");
    },
    [runSave]
  );

  const addRenewalType = useCallback(
    async (data: RenewalTypeFormData) =>
      runSave(async () => {
        const created = await mastersApi.renewalFrequencies.create(mapRenewalTypeToDto(data));
        const mapped = mapRenewalTypeFromDto(created);
        setRenewalTypes((prev) => [mapped, ...prev]);
        return mapped;
      }, "Renewal frequency created."),
    [runSave]
  );

  const updateRenewalType = useCallback(
    async (id: string, data: RenewalTypeFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.renewalFrequencies.update(id, mapRenewalTypeToDto(data));
        const mapped = mapRenewalTypeFromDto(updated);
        setRenewalTypes((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Renewal frequency updated.");
    },
    [runSave]
  );

  const deleteRenewalType = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.renewalFrequencies.delete(id);
        setRenewalTypes((prev) => prev.filter((item) => item.id !== id));
      }, "Renewal frequency deleted.");
    },
    [runSave]
  );

  const addCountry = useCallback(
    async (data: CountryFormData) =>
      runSave(async () => {
        const created = await mastersApi.countries.create(mapCountryToDto(data));
        const mapped = mapCountryFromDto(created);
        setCountries((prev) => [mapped, ...prev]);
        return mapped;
      }, "Country created."),
    [runSave]
  );

  const updateCountry = useCallback(
    async (id: string, data: CountryFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.countries.update(id, mapCountryToDto(data));
        const mapped = mapCountryFromDto(updated);
        setCountries((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "Country updated.");
    },
    [runSave]
  );

  const deleteCountry = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.countries.delete(id);
        setCountries((prev) => prev.filter((item) => item.id !== id));
      }, "Country deleted.");
    },
    [runSave]
  );

  const addState = useCallback(
    async (data: StateFormData) =>
      runSave(async () => {
        const created = await mastersApi.states.create(mapStateToDto(data));
        const mapped = mapStateFromDto(created);
        setStates((prev) => [mapped, ...prev]);
        return mapped;
      }, "State created."),
    [runSave]
  );

  const updateState = useCallback(
    async (id: string, data: StateFormData) => {
      await runSave(async () => {
        const updated = await mastersApi.states.update(id, mapStateToDto(data));
        const mapped = mapStateFromDto(updated);
        setStates((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      }, "State updated.");
    },
    [runSave]
  );

  const deleteState = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await mastersApi.states.delete(id);
        setStates((prev) => prev.filter((item) => item.id !== id));
      }, "State deleted.");
    },
    [runSave]
  );

  const addEmployee = useCallback((data: EmployeeFormData): SettingsEmployee => {
    const employee: SettingsEmployee = {
      id: `emp-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      department: data.department.trim(),
      designation: data.designation.trim(),
      status: data.status,
    };
    setEmployees((prev) => {
      const next = [employee, ...prev];
      persistJson(EMPLOYEES_KEY, next);
      return next;
    });
    return employee;
  }, []);

  const updateEmployee = useCallback((id: string, data: EmployeeFormData) => {
    setEmployees((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: data.name.trim(),
              department: data.department.trim(),
              designation: data.designation.trim(),
              status: data.status,
            }
          : item
      );
      persistJson(EMPLOYEES_KEY, next);
      return next;
    });
  }, []);

  const addVendor = useCallback((data: VendorFormData): SettingsVendor => {
    const vendor: SettingsVendor = {
      id: `ven-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      category: data.category.trim(),
      contactPerson: data.contactPerson.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      status: data.status,
    };
    setVendors((prev) => {
      const next = [vendor, ...prev];
      persistJson(VENDORS_KEY, next);
      return next;
    });
    return vendor;
  }, []);

  const updateVendor = useCallback((id: string, data: VendorFormData) => {
    setVendors((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: data.name.trim(),
              category: data.category.trim(),
              contactPerson: data.contactPerson.trim(),
              phone: data.phone.trim(),
              email: data.email.trim(),
              status: data.status,
            }
          : item
      );
      persistJson(VENDORS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      loading,
      saving,
      error,
      successMessage,
      company,
      finance,
      branding,
      preferences,
      opportunitySources,
      industries,
      stages,
      dealTypes,
      paymentMethods,
      expenseCategories,
      renewalTypes,
      countries,
      states,
      employees,
      vendors,
      clearMessages,
      refreshSettings,
      updateCompany,
      updateFinance,
      updateBranding,
      updatePreferences,
      addOpportunitySource,
      updateOpportunitySource,
      deleteOpportunitySource,
      addIndustry,
      updateIndustry,
      deleteIndustry,
      addStage,
      updateStage,
      deleteStage,
      addDealType,
      updateDealType,
      deleteDealType,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addExpenseCategory,
      updateExpenseCategory,
      deleteExpenseCategory,
      addRenewalType,
      updateRenewalType,
      deleteRenewalType,
      addCountry,
      updateCountry,
      deleteCountry,
      addState,
      updateState,
      deleteState,
      addEmployee,
      updateEmployee,
      addVendor,
      updateVendor,
    }),
    [
      loading,
      saving,
      error,
      successMessage,
      company,
      finance,
      branding,
      preferences,
      opportunitySources,
      industries,
      stages,
      dealTypes,
      paymentMethods,
      expenseCategories,
      renewalTypes,
      countries,
      states,
      employees,
      vendors,
      clearMessages,
      refreshSettings,
      updateCompany,
      updateFinance,
      updateBranding,
      updatePreferences,
      addOpportunitySource,
      updateOpportunitySource,
      deleteOpportunitySource,
      addIndustry,
      updateIndustry,
      deleteIndustry,
      addStage,
      updateStage,
      deleteStage,
      addDealType,
      updateDealType,
      deleteDealType,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addExpenseCategory,
      updateExpenseCategory,
      deleteExpenseCategory,
      addRenewalType,
      updateRenewalType,
      deleteRenewalType,
      addCountry,
      updateCountry,
      deleteCountry,
      addState,
      updateState,
      deleteState,
      addEmployee,
      updateEmployee,
      addVendor,
      updateVendor,
    ]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}
