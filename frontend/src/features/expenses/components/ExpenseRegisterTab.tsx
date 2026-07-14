import { CalendarClock, IndianRupee, Plus, ReceiptText, RefreshCw } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AddExpenseTransactionDialog } from "@/features/expenses/components/AddExpenseTransactionDialog";
import { ExpenseRegisterFiltersBar } from "@/features/expenses/components/ExpenseRegisterFiltersBar";
import { ExpenseRegisterSkeleton } from "@/features/expenses/components/ExpenseRegisterSkeleton";
import { ExpenseRegisterTable } from "@/features/expenses/components/ExpenseRegisterTable";
import { UpdateRecurringTemplateDialog } from "@/features/expenses/components/UpdateRecurringTemplateDialog";
import { StatCard } from "@/shared/components/PageHeader";
import { Button } from "@/shared/ui/button";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import {
  computeRegisterStats,
  defaultRegisterFilters,
  filterTransactions,
  formatExpenseCurrency,
  parseAmount,
} from "@/features/expenses/utils/expense-utils";
import type { ExpenseRegisterFilters, ExpenseTransaction, ExpenseTransactionFormData } from "@/features/expenses/types/expense";

interface ExpenseRegisterTabProps {
  expenseId?: string | null;
  onExpenseIdHandled?: () => void;
  onAddExpense?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function ExpenseRegisterTab({
  expenseId,
  onExpenseIdHandled,
  onAddExpense,
  dialogOpen: controlledOpen,
  onDialogOpenChange,
}: ExpenseRegisterTabProps) {
  const {
    transactions,
    masters,
    categories,
    vendors,
    employees,
    loading: expensesLoading,
    error,
    addTransaction,
    updateTransaction,
    addCategory,
    addVendor,
    addEmployee,
    addMaster,
  } = useExpenses();

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ExpenseRegisterFilters>(defaultRegisterFilters);
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ExpenseTransaction | undefined>();
  const [templatePrompt, setTemplatePrompt] = useState<{
    data: ExpenseTransactionFormData;
    oldAmount: number;
    name: string;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dialogOpen = controlledOpen ?? internalOpen;
  const setDialogOpen = onDialogOpenChange ?? setInternalOpen;

  const deferredQuery = useDeferredValue(query);
  const deferredFilters = useDeferredValue(filters);
  const loading =
    expensesLoading ||
    !ready ||
    query !== deferredQuery ||
    filters !== deferredFilters;

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !expenseId) return;

    const transaction = transactions.find((txn) => txn.id === expenseId);
    if (transaction) {
      setEditingTransaction(transaction);
      setDialogOpen(true);
    }
    onExpenseIdHandled?.();
  }, [ready, expenseId, transactions, onExpenseIdHandled, setDialogOpen]);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, deferredQuery, deferredFilters),
    [transactions, deferredQuery, deferredFilters]
  );

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.datePreset !== defaultRegisterFilters().datePreset ||
    filters.category !== defaultRegisterFilters().category ||
    filters.status !== defaultRegisterFilters().status ||
    filters.vendor !== defaultRegisterFilters().vendor ||
    filters.employee !== defaultRegisterFilters().employee ||
    filters.paymentMethod !== defaultRegisterFilters().paymentMethod;

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultRegisterFilters());
  };

  const stats = useMemo(
    () => computeRegisterStats(filteredTransactions, masters),
    [filteredTransactions, masters]
  );

  const handleAdd = () => {
    setEditingTransaction(undefined);
    setDialogOpen(true);
    onAddExpense?.();
  };

  const handleEdit = (transaction: ExpenseTransaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSave = (data: ExpenseTransactionFormData) => {
    void (async () => {
      setSaveError(null);
      try {
        if (editingTransaction) {
          const newAmount = parseAmount(data.amount);
          if (
            editingTransaction.masterTemplateId &&
            editingTransaction.amount !== newAmount
          ) {
            setTemplatePrompt({
              data,
              oldAmount: editingTransaction.amount,
              name: editingTransaction.name,
            });
            setDialogOpen(false);
            return;
          }
          await updateTransaction(editingTransaction.id, data);
          setEditingTransaction(undefined);
          return;
        }
        await addTransaction(data);
        setEditingTransaction(undefined);
      } catch (err) {
        setSaveError(getErrorMessage(err));
      }
    })();
  };

  const handleTemplateDecision = (updateTemplate: boolean) => {
    if (!templatePrompt || !editingTransaction) return;
    void updateTransaction(editingTransaction.id, templatePrompt.data, {
      updateTemplate,
    })
      .then(() => {
        setTemplatePrompt(null);
        setEditingTransaction(undefined);
      })
      .catch((err) => {
        setSaveError(getErrorMessage(err));
      });
  };

  const handleCreateMasterFromName = (name: string) => {
    void addMaster({
      name,
      categoryId: categories[0]?.id ?? "",
      payeeType: "vendor",
      vendorOrEmployee: vendors[0]?.name ?? "Vendor",
      vendorId: vendors[0]?.id,
      defaultAmount: "1",
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0]!,
      endDate: "",
      autoGenerate: false,
      status: "inactive",
    }).catch((err) => {
      setSaveError(getErrorMessage(err));
    });
  };

  if (loading) {
    return <ExpenseRegisterSkeleton />;
  }

  return (
    <div className="space-y-6">
      {(error || saveError) && (
        <p role="alert" className="text-sm text-destructive">
          {saveError ?? error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Expense"
          value={formatExpenseCurrency(stats.totalExpense)}
          icon={<ReceiptText className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
        />
        <StatCard
          label="Paid"
          value={formatExpenseCurrency(stats.paid)}
          icon={<IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Pending"
          value={formatExpenseCurrency(stats.pending)}
          icon={<CalendarClock className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
        />
        <StatCard
          label="Upcoming Recurring"
          value={formatExpenseCurrency(stats.upcomingRecurring)}
          icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
        />
      </div>

      <ExpenseRegisterFiltersBar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        vendors={vendors}
        employees={employees}
      />

      <ExpenseRegisterTable
        transactions={filteredTransactions}
        categories={categories}
        onEdit={handleEdit}
        isFiltered={hasActiveFilters}
        isEmpty={transactions.length === 0}
        onAdd={handleAdd}
        onResetFilters={resetFilters}
      />

      {controlledOpen === undefined && (
        <div className="flex justify-end lg:hidden">
          <Button onClick={handleAdd} className="rounded-xl">
            <Plus />
            Add Expense
          </Button>
        </div>
      )}

      <AddExpenseTransactionDialog
        key={`${editingTransaction?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        categories={categories}
        vendors={vendors}
        employees={employees}
        masters={masters}
        onCreateCategory={addCategory}
        onCreateVendor={addVendor}
        onCreateEmployee={addEmployee}
        onCreateMaster={handleCreateMasterFromName}
        initialData={editingTransaction}
      />

      {templatePrompt && (
        <UpdateRecurringTemplateDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              void updateTransaction(editingTransaction!.id, templatePrompt.data, {
                updateTemplate: false,
              }).finally(() => {
                setTemplatePrompt(null);
                setEditingTransaction(undefined);
              });
            }
          }}
          expenseName={templatePrompt.name}
          oldAmount={templatePrompt.oldAmount}
          newAmount={parseAmount(templatePrompt.data.amount)}
          onConfirm={handleTemplateDecision}
        />
      )}
    </div>
  );
}
