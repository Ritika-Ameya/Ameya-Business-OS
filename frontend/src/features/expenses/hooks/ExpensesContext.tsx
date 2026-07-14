import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { expenseMastersApi, expensesApi } from "@/features/expenses/api/expenses.api";
import {
  mapExpenseFromDto,
  mapExpenseMasterFromDto,
  mapMasterFormToBody,
  mapTransactionFormToBody,
} from "@/features/expenses/api/expense.mappers";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import {
  toEmployeeItems,
  toExpenseCategoryItems,
  toVendorItems,
} from "@/features/settings/utils/app-config-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type {
  EmployeeItem,
  ExpenseCategoryItem,
  ExpenseMasterFormData,
  ExpenseMasterTemplate,
  ExpenseTransaction,
  ExpenseTransactionFormData,
  VendorItem,
} from "@/features/expenses/types/expense";
import type { ExpenseCategoryFormData } from "@/features/settings/types/settings";

interface UpdateTransactionOptions {
  updateTemplate?: boolean;
}

interface ExpensesContextValue {
  transactions: ExpenseTransaction[];
  masters: ExpenseMasterTemplate[];
  categories: ExpenseCategoryItem[];
  vendors: VendorItem[];
  employees: EmployeeItem[];
  loading: boolean;
  error: string | null;
  refreshExpenses: () => Promise<void>;
  addTransaction: (data: ExpenseTransactionFormData) => Promise<ExpenseTransaction>;
  updateTransaction: (
    id: string,
    data: ExpenseTransactionFormData,
    options?: UpdateTransactionOptions
  ) => Promise<void>;
  addMaster: (data: ExpenseMasterFormData) => Promise<ExpenseMasterTemplate>;
  updateMaster: (id: string, data: ExpenseMasterFormData) => Promise<void>;
  addCategory: (name: string) => Promise<ExpenseCategoryItem>;
  addVendor: (name: string) => VendorItem;
  addEmployee: (name: string) => EmployeeItem;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export { ExpensesContext };

function upsertTransaction(
  list: ExpenseTransaction[],
  transaction: ExpenseTransaction
): ExpenseTransaction[] {
  const index = list.findIndex((item) => item.id === transaction.id);
  if (index === -1) return [transaction, ...list];
  const next = [...list];
  next[index] = transaction;
  return next;
}

function upsertMaster(
  list: ExpenseMasterTemplate[],
  master: ExpenseMasterTemplate
): ExpenseMasterTemplate[] {
  const index = list.findIndex((item) => item.id === master.id);
  if (index === -1) return [master, ...list];
  const next = [...list];
  next[index] = master;
  return next;
}

function ExpensesProviderInner({ children }: { children: ReactNode }) {
  const appConfig = useAppConfig();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [masters, setMasters] = useState<ExpenseMasterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const refreshExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [masterDtos, expenseDtos] = await Promise.all([
        expenseMastersApi.list(),
        expensesApi.list(),
      ]);
      setMasters(masterDtos.map(mapExpenseMasterFromDto));
      setTransactions(expenseDtos.map(mapExpenseFromDto));
    } catch (err) {
      setError(getErrorMessage(err));
      setMasters([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load from backend (list also triggers server-side recurring generation)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void refreshExpenses();
  }, [refreshExpenses]);

  const addCategory = useCallback(
    async (name: string): Promise<ExpenseCategoryItem> => {
      const category = await appConfig.addExpenseCategory({
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
    async (data: ExpenseMasterFormData): Promise<ExpenseMasterTemplate> => {
      const created = await expenseMastersApi.create(mapMasterFormToBody(data));
      const master = mapExpenseMasterFromDto(created);
      setMasters((prev) => [master, ...prev]);
      // Refresh transactions so server-generated recurring rows appear
      const expenseDtos = await expensesApi.list();
      setTransactions(expenseDtos.map(mapExpenseFromDto));
      return master;
    },
    []
  );

  const updateMaster = useCallback(async (id: string, data: ExpenseMasterFormData) => {
    const updated = await expenseMastersApi.update(id, mapMasterFormToBody(data));
    const master = mapExpenseMasterFromDto(updated);
    setMasters((prev) => upsertMaster(prev, master));
    const expenseDtos = await expensesApi.list();
    setTransactions(expenseDtos.map(mapExpenseFromDto));
  }, []);

  const addTransaction = useCallback(
    async (data: ExpenseTransactionFormData): Promise<ExpenseTransaction> => {
      const created = await expensesApi.create(mapTransactionFormToBody(data));
      const transaction = mapExpenseFromDto(created);
      setTransactions((prev) => [transaction, ...prev]);

      if (data.recurring && data.createMaster && data.masterFrequency) {
        await addMaster({
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
    async (
      id: string,
      data: ExpenseTransactionFormData,
      options?: UpdateTransactionOptions
    ) => {
      const existing = transactions.find((txn) => txn.id === id);
      const updated = await expensesApi.update(id, mapTransactionFormToBody(data, existing));
      const transaction = mapExpenseFromDto(updated);
      setTransactions((prev) => upsertTransaction(prev, transaction));

      if (
        options?.updateTemplate &&
        existing?.masterTemplateId &&
        existing.amount !== transaction.amount
      ) {
        const master = masters.find((item) => item.id === existing.masterTemplateId);
        if (master) {
          const masterUpdated = await expenseMastersApi.update(master.id, {
            defaultAmount: transaction.amount,
          });
          setMasters((prev) =>
            upsertMaster(prev, mapExpenseMasterFromDto(masterUpdated))
          );
        }
      }
    },
    [transactions, masters]
  );

  const value = useMemo(
    () => ({
      transactions,
      masters,
      categories,
      vendors,
      employees,
      loading,
      error,
      refreshExpenses,
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
      loading,
      error,
      refreshExpenses,
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
