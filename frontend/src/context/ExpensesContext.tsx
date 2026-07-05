import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { legacyCategoryIdMap } from "@/data/seed-settings";
import {
  seedExpenseMasters,
  seedExpenseTransactions,
} from "@/data/seed-expenses";
import { useAppConfig } from "@/hooks/use-app-config";
import {
  toEmployeeItems,
  toExpenseCategoryItems,
  toVendorItems,
} from "@/lib/app-config-utils";
import {
  generateRecurringTransactions,
  parseAmount,
} from "@/lib/expense-utils";
import type {
  EmployeeItem,
  ExpenseCategoryItem,
  ExpenseMasterFormData,
  ExpenseMasterTemplate,
  ExpenseTransaction,
  ExpenseTransactionFormData,
  VendorItem,
} from "@/types/expense";
import type { ExpenseCategoryFormData } from "@/types/settings";

const TXN_KEY = "ameya-expense-transactions-v2";
const MASTER_KEY = "ameya-expense-masters-v2";

interface UpdateTransactionOptions {
  updateTemplate?: boolean;
}

interface ExpensesContextValue {
  transactions: ExpenseTransaction[];
  masters: ExpenseMasterTemplate[];
  categories: ExpenseCategoryItem[];
  vendors: VendorItem[];
  employees: EmployeeItem[];
  addTransaction: (data: ExpenseTransactionFormData) => ExpenseTransaction;
  updateTransaction: (
    id: string,
    data: ExpenseTransactionFormData,
    options?: UpdateTransactionOptions
  ) => void;
  addMaster: (data: ExpenseMasterFormData) => ExpenseMasterTemplate;
  updateMaster: (id: string, data: ExpenseMasterFormData) => void;
  addCategory: (name: string) => ExpenseCategoryItem;
  addVendor: (name: string) => VendorItem;
  addEmployee: (name: string) => EmployeeItem;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export { ExpensesContext };

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

function migrateCategoryIds(transactions: ExpenseTransaction[]): ExpenseTransaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    categoryId:
      legacyCategoryIdMap[transaction.categoryId] ?? transaction.categoryId,
  }));
}

function migrateMasterCategoryIds(
  masters: ExpenseMasterTemplate[]
): ExpenseMasterTemplate[] {
  return masters.map((master) => ({
    ...master,
    categoryId: legacyCategoryIdMap[master.categoryId] ?? master.categoryId,
  }));
}

function formToTransaction(
  data: ExpenseTransactionFormData,
  existing?: ExpenseTransaction
): Omit<ExpenseTransaction, "id"> {
  return {
    date: data.date,
    categoryId: data.categoryId,
    name: data.name.trim(),
    vendorOrEmployee: data.vendorOrEmployee.trim(),
    payeeType: data.payeeType,
    vendorId: data.vendorId,
    employeeId: data.employeeId,
    amount: parseAmount(data.amount),
    status: data.status,
    paymentMethod: data.paymentMethod || undefined,
    referenceNumber: data.referenceNumber.trim() || undefined,
    notes: data.notes.trim() || undefined,
    hasAttachment: data.hasAttachment,
    recurring: data.recurring,
    masterTemplateId: existing?.masterTemplateId,
    generatedPeriod: existing?.generatedPeriod,
  };
}

function formToMaster(data: ExpenseMasterFormData): Omit<ExpenseMasterTemplate, "id"> {
  return {
    name: data.name.trim(),
    categoryId: data.categoryId,
    vendorOrEmployee: data.vendorOrEmployee.trim(),
    payeeType: data.payeeType,
    vendorId: data.vendorId,
    employeeId: data.employeeId,
    defaultAmount: parseAmount(data.defaultAmount),
    frequency: data.frequency as ExpenseMasterTemplate["frequency"],
    startDate: data.startDate,
    endDate: data.endDate.trim() || undefined,
    autoGenerate: data.autoGenerate,
    status: data.status,
  };
}

function loadInitialExpenseState() {
  const masters = migrateMasterCategoryIds(loadJson(MASTER_KEY, seedExpenseMasters));
  const loaded = migrateCategoryIds(loadJson(TXN_KEY, seedExpenseTransactions));
  const generated = generateRecurringTransactions(masters, loaded);
  const transactions =
    generated.length > 0 ? [...generated, ...loaded] : loaded;
  if (generated.length > 0) {
    persistJson(TXN_KEY, transactions);
  }
  return { masters, transactions };
}

function ExpensesProviderInner({ children }: { children: ReactNode }) {
  const appConfig = useAppConfig();
  const initial = loadInitialExpenseState();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>(
    initial.transactions
  );
  const [masters, setMasters] = useState<ExpenseMasterTemplate[]>(initial.masters);

  const categories = useMemo(
    () => toExpenseCategoryItems(appConfig.expenseCategories),
    [appConfig.expenseCategories]
  );
  const vendors = useMemo(
    () => toVendorItems(appConfig.vendors),
    [appConfig.vendors]
  );
  const employees = useMemo(
    () => toEmployeeItems(appConfig.employees),
    [appConfig.employees]
  );

  const appendGeneratedTransactions = useCallback(
    (masterList: ExpenseMasterTemplate[], current: ExpenseTransaction[]) => {
      const generated = generateRecurringTransactions(masterList, current);
      if (generated.length === 0) return current;
      const next = [...generated, ...current];
      persistJson(TXN_KEY, next);
      return next;
    },
    []
  );

  const addCategory = useCallback(
    (name: string): ExpenseCategoryItem => {
      const category = appConfig.addExpenseCategory({
        name,
        description: "",
        status: "active",
      } satisfies ExpenseCategoryFormData);
      return { id: category.id, name: category.name, isCustom: true };
    },
    [appConfig]
  );

  const addVendor = useCallback(
    (name: string): VendorItem => {
      const vendor = appConfig.addVendor({
        name,
        category: "",
        contactPerson: "",
        phone: "",
        email: "",
        status: "active",
      });
      return { id: vendor.id, name: vendor.name };
    },
    [appConfig]
  );

  const addEmployee = useCallback(
    (name: string): EmployeeItem => {
      const employee = appConfig.addEmployee({
        name,
        department: "",
        designation: "",
        status: "active",
      });
      return { id: employee.id, name: employee.name };
    },
    [appConfig]
  );

  const addMaster = useCallback(
    (data: ExpenseMasterFormData): ExpenseMasterTemplate => {
      const master: ExpenseMasterTemplate = {
        id: `master-${crypto.randomUUID().slice(0, 8)}`,
        ...formToMaster(data),
      };
      let nextMasters: ExpenseMasterTemplate[] = [];
      setMasters((prev) => {
        nextMasters = [master, ...prev];
        persistJson(MASTER_KEY, nextMasters);
        return nextMasters;
      });
      setTransactions((txnPrev) => appendGeneratedTransactions(nextMasters, txnPrev));
      return master;
    },
    [appendGeneratedTransactions]
  );

  const updateMaster = useCallback(
    (id: string, data: ExpenseMasterFormData) => {
      let nextMasters: ExpenseMasterTemplate[] = [];
      setMasters((prev) => {
        nextMasters = prev.map((master) =>
          master.id === id ? { ...master, ...formToMaster(data) } : master
        );
        persistJson(MASTER_KEY, nextMasters);
        return nextMasters;
      });
      setTransactions((txnPrev) => appendGeneratedTransactions(nextMasters, txnPrev));
    },
    [appendGeneratedTransactions]
  );

  const addTransaction = useCallback(
    (data: ExpenseTransactionFormData): ExpenseTransaction => {
      const transaction: ExpenseTransaction = {
        id: `txn-${crypto.randomUUID().slice(0, 8)}`,
        ...formToTransaction(data),
      };

      setTransactions((prev) => {
        const next = [transaction, ...prev];
        persistJson(TXN_KEY, next);
        return next;
      });

      if (data.recurring && data.createMaster && data.masterFrequency) {
        addMaster({
          name: data.name,
          categoryId: data.categoryId,
          payeeType: data.payeeType,
          vendorOrEmployee: data.vendorOrEmployee,
          vendorId: data.vendorId,
          employeeId: data.employeeId,
          defaultAmount: data.amount,
          frequency: data.masterFrequency,
          startDate: data.date,
          endDate: "",
          autoGenerate: data.masterAutoGenerate ?? true,
          status: "active",
        });
      }

      return transaction;
    },
    [addMaster]
  );

  const updateTransaction = useCallback(
    (
      id: string,
      data: ExpenseTransactionFormData,
      options?: UpdateTransactionOptions
    ) => {
      const existing = transactions.find((txn) => txn.id === id);
      const newAmount = parseAmount(data.amount);

      setTransactions((prev) => {
        const next = prev.map((txn) =>
          txn.id === id ? { ...txn, ...formToTransaction(data, txn) } : txn
        );
        persistJson(TXN_KEY, next);
        return next;
      });

      if (
        options?.updateTemplate &&
        existing?.masterTemplateId &&
        existing.amount !== newAmount
      ) {
        setMasters((masterPrev) => {
          const masterNext = masterPrev.map((master) =>
            master.id === existing.masterTemplateId
              ? { ...master, defaultAmount: newAmount }
              : master
          );
          persistJson(MASTER_KEY, masterNext);
          return masterNext;
        });
      }
    },
    [transactions]
  );

  const value = useMemo(
    () => ({
      transactions,
      masters,
      categories,
      vendors,
      employees,
      addTransaction,
      updateTransaction,
      addMaster,
      updateMaster,
      addCategory,
      addVendor,
      addEmployee,
    }),
    [
      transactions,
      masters,
      categories,
      vendors,
      employees,
      addTransaction,
      updateTransaction,
      addMaster,
      updateMaster,
      addCategory,
      addVendor,
      addEmployee,
    ]
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  return <ExpensesProviderInner>{children}</ExpensesProviderInner>;
}
