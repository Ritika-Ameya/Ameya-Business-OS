import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  seedCompanySettings,
  seedFinanceSettings,
  seedPreferencesSettings,
  seedSettingsDealTypes,
  seedSettingsEmployees,
  seedSettingsExpenseCategories,
  seedSettingsPaymentMethods,
  seedSettingsRenewalTypes,
  seedSettingsVendors,
} from "@/features/settings/data/seed-settings";
import { slugifyName } from "@/features/settings/utils/app-config-utils";
import type { AppConfigValue } from "@/features/settings/types/app-config";
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
  SettingsVendor,
  VendorFormData,
} from "@/features/settings/types/settings";

const COMPANY_KEY = "ameya-settings-company";
const FINANCE_KEY = "ameya-settings-finance";
const PREFERENCES_KEY = "ameya-settings-preferences";
const EMPLOYEES_KEY = "ameya-settings-employees";
const VENDORS_KEY = "ameya-settings-vendors";
const CATEGORIES_KEY = "ameya-settings-expense-categories";
const RENEWAL_TYPES_KEY = "ameya-settings-renewal-types";
const PAYMENT_METHODS_KEY = "ameya-settings-payment-methods";
const DEAL_TYPES_KEY = "ameya-settings-deal-types";

const LEGACY_EXPENSE_CATEGORY_KEY = "ameya-expense-categories";
const LEGACY_EXPENSE_VENDOR_KEY = "ameya-expense-vendors";
const LEGACY_EXPENSE_EMPLOYEE_KEY = "ameya-expense-employees";

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

function migratePaymentMethods(methods: SettingsPaymentMethod[]): SettingsPaymentMethod[] {
  return methods.map((method) => ({
    ...method,
    slug: method.slug ?? slugifyName(method.name),
  }));
}

function cleanupLegacyExpenseMasterKeys() {
  localStorage.removeItem(LEGACY_EXPENSE_CATEGORY_KEY);
  localStorage.removeItem(LEGACY_EXPENSE_VENDOR_KEY);
  localStorage.removeItem(LEGACY_EXPENSE_EMPLOYEE_KEY);
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanySettings>(() =>
    loadJson(COMPANY_KEY, seedCompanySettings)
  );
  const [finance, setFinance] = useState<FinanceSettings>(() =>
    loadJson(FINANCE_KEY, seedFinanceSettings)
  );
  const [preferences, setPreferences] = useState<PreferencesSettings>(() =>
    loadJson(PREFERENCES_KEY, seedPreferencesSettings)
  );
  const [employees, setEmployees] = useState<SettingsEmployee[]>(() =>
    loadJson(EMPLOYEES_KEY, seedSettingsEmployees)
  );
  const [vendors, setVendors] = useState<SettingsVendor[]>(() =>
    loadJson(VENDORS_KEY, seedSettingsVendors)
  );
  const [expenseCategories, setExpenseCategories] = useState<SettingsExpenseCategory[]>(
    () => loadJson(CATEGORIES_KEY, seedSettingsExpenseCategories)
  );
  const [renewalTypes, setRenewalTypes] = useState<SettingsRenewalType[]>(() =>
    loadJson(RENEWAL_TYPES_KEY, seedSettingsRenewalTypes)
  );
  const [paymentMethods, setPaymentMethods] = useState<SettingsPaymentMethod[]>(() =>
    migratePaymentMethods(loadJson(PAYMENT_METHODS_KEY, seedSettingsPaymentMethods))
  );
  const [dealTypes, setDealTypes] = useState<SettingsDealType[]>(() =>
    loadJson(DEAL_TYPES_KEY, seedSettingsDealTypes)
  );

  useEffect(() => {
    cleanupLegacyExpenseMasterKeys();
  }, []);

  const updateCompany = useCallback((data: CompanySettings) => {
    setCompany(data);
    persistJson(COMPANY_KEY, data);
  }, []);

  const updateFinance = useCallback((data: FinanceSettings) => {
    setFinance(data);
    persistJson(FINANCE_KEY, data);
  }, []);

  const updatePreferences = useCallback((data: PreferencesSettings) => {
    setPreferences(data);
    persistJson(PREFERENCES_KEY, data);
  }, []);

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

  const addExpenseCategory = useCallback(
    (data: ExpenseCategoryFormData): SettingsExpenseCategory => {
      const category: SettingsExpenseCategory = {
        id: `cat-${crypto.randomUUID().slice(0, 8)}`,
        name: data.name.trim(),
        description: data.description.trim(),
        status: data.status,
      };
      setExpenseCategories((prev) => {
        const next = [category, ...prev];
        persistJson(CATEGORIES_KEY, next);
        return next;
      });
      return category;
    },
    []
  );

  const updateExpenseCategory = useCallback(
    (id: string, data: ExpenseCategoryFormData) => {
      setExpenseCategories((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name: data.name.trim(),
                description: data.description.trim(),
                status: data.status,
              }
            : item
        );
        persistJson(CATEGORIES_KEY, next);
        return next;
      });
    },
    []
  );

  const addRenewalType = useCallback(
    (data: RenewalTypeFormData): SettingsRenewalType => {
      const renewalType: SettingsRenewalType = {
        id: `ren-${crypto.randomUUID().slice(0, 8)}`,
        name: data.name.trim(),
        status: data.status,
      };
      setRenewalTypes((prev) => {
        const next = [renewalType, ...prev];
        persistJson(RENEWAL_TYPES_KEY, next);
        return next;
      });
      return renewalType;
    },
    []
  );

  const updateRenewalType = useCallback((id: string, data: RenewalTypeFormData) => {
    setRenewalTypes((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? { ...item, name: data.name.trim(), status: data.status }
          : item
      );
      persistJson(RENEWAL_TYPES_KEY, next);
      return next;
    });
  }, []);

  const addPaymentMethod = useCallback(
    (data: PaymentMethodFormData): SettingsPaymentMethod => {
      const method: SettingsPaymentMethod = {
        id: `pay-${crypto.randomUUID().slice(0, 8)}`,
        name: data.name.trim(),
        slug: data.slug.trim() || slugifyName(data.name),
        status: data.status,
      };
      setPaymentMethods((prev) => {
        const next = [method, ...prev];
        persistJson(PAYMENT_METHODS_KEY, next);
        return next;
      });
      return method;
    },
    []
  );

  const updatePaymentMethod = useCallback(
    (id: string, data: PaymentMethodFormData) => {
      setPaymentMethods((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name: data.name.trim(),
                slug: data.slug.trim() || slugifyName(data.name),
                status: data.status,
              }
            : item
        );
        persistJson(PAYMENT_METHODS_KEY, next);
        return next;
      });
    },
    []
  );

  const addDealType = useCallback((data: DealTypeFormData): SettingsDealType => {
    const dealType: SettingsDealType = {
      id: `dtype-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      slug: data.slug.trim() || slugifyName(data.name),
      status: data.status,
    };
    setDealTypes((prev) => {
      const next = [dealType, ...prev];
      persistJson(DEAL_TYPES_KEY, next);
      return next;
    });
    return dealType;
  }, []);

  const updateDealType = useCallback((id: string, data: DealTypeFormData) => {
    setDealTypes((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: data.name.trim(),
              slug: data.slug.trim() || slugifyName(data.name),
              status: data.status,
            }
          : item
      );
      persistJson(DEAL_TYPES_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      company,
      finance,
      preferences,
      employees,
      vendors,
      expenseCategories,
      renewalTypes,
      paymentMethods,
      dealTypes,
      updateCompany,
      updateFinance,
      updatePreferences,
      addEmployee,
      updateEmployee,
      addVendor,
      updateVendor,
      addExpenseCategory,
      updateExpenseCategory,
      addRenewalType,
      updateRenewalType,
      addPaymentMethod,
      updatePaymentMethod,
      addDealType,
      updateDealType,
    }),
    [
      company,
      finance,
      preferences,
      employees,
      vendors,
      expenseCategories,
      renewalTypes,
      paymentMethods,
      dealTypes,
      updateCompany,
      updateFinance,
      updatePreferences,
      addEmployee,
      updateEmployee,
      addVendor,
      updateVendor,
      addExpenseCategory,
      updateExpenseCategory,
      addRenewalType,
      updateRenewalType,
      addPaymentMethod,
      updatePaymentMethod,
      addDealType,
      updateDealType,
    ]
  );

  return (
    <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
  );
}
