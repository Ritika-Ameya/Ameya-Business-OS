import { CalendarClock, IndianRupee, Plus, ReceiptText, RefreshCw } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AddExpenseTransactionDialog } from "@/features/expenses/components/AddExpenseTransactionDialog";
import { ExpenseRegisterFiltersBar } from "@/features/expenses/components/ExpenseRegisterFiltersBar";
import { ExpenseRegisterSkeleton } from "@/features/expenses/components/ExpenseRegisterSkeleton";
import { ExpenseRegisterTable } from "@/features/expenses/components/ExpenseRegisterTable";
import { UpdateRecurringTemplateDialog } from "@/features/expenses/components/UpdateRecurringTemplateDialog";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog, type StatDetailRow } from "@/shared/components/StatDetailDialog";
import { Button } from "@/shared/ui/button";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { expensesApi } from "@/features/expenses/api/expenses.api";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { fileToUploadPayload } from "@/shared/utils";
import { formatDate, toLocalIsoDate } from "@/shared/utils/format-date";
import {
  computeRegisterStats,
  defaultRegisterFilters,
  filterTransactions,
  formatExpenseCurrency,
  parseAmount,
  withoutStoppedPendingGenerations,
} from "@/features/expenses/utils/expense-utils";
import { ALL_TIME, datePresetPeriodLabel } from "@/shared/utils/period-label";
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
    removeTransaction,
    refreshExpenses,
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
    if (!transaction) return;

    setEditingTransaction(transaction);
    setDialogOpen(true);
    onExpenseIdHandled?.();
  }, [ready, expenseId, transactions, onExpenseIdHandled, setDialogOpen]);

  const liveTransactions = useMemo(
    () => withoutStoppedPendingGenerations(transactions, masters),
    [transactions, masters]
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(liveTransactions, deferredQuery, deferredFilters),
    [liveTransactions, deferredQuery, deferredFilters]
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
  const [openStat, setOpenStat] = useState<"total" | "paid" | "pending" | "recurring" | null>(
    null
  );
  const expenseRow = (txn: ExpenseTransaction): StatDetailRow => ({
    id: txn.id,
    title: txn.name,
    subtitle: txn.vendorOrEmployee ? `Payee · ${txn.vendorOrEmployee}` : undefined,
    detail: `${txn.status === "paid" ? "Paid" : txn.status === "pending" ? "Pending" : txn.status} · ${formatDate(txn.date)}`,
    value: formatExpenseCurrency(txn.amount),
  });
  const paidTxns = filteredTransactions.filter((txn) => txn.status === "paid");
  const pendingTxns = filteredTransactions.filter(
    (txn) => txn.status === "pending" || txn.status === "partial"
  );
  const recurringMasters = masters.filter(
    (master) => master.status === "active" && master.autoGenerate
  );
  const statDetail =
    openStat === "total"
      ? {
          title: "Total expense",
          nameLabel: "Expense",
          valueLabel: "Amount",
          rows: filteredTransactions.map(expenseRow),
          empty: "No expenses in this view.",
        }
      : openStat === "paid"
        ? {
            title: "Paid expenses",
            nameLabel: "Expense",
            valueLabel: "Amount paid",
            rows: paidTxns.map(expenseRow),
            empty: "No paid expenses in this view.",
          }
        : openStat === "pending"
          ? {
              title: "Pending expenses",
              nameLabel: "Expense",
              valueLabel: "Still to pay",
              rows: pendingTxns.map(expenseRow),
              empty: "No pending expenses in this view.",
            }
          : openStat === "recurring"
            ? {
                title: "Upcoming recurring",
                nameLabel: "Template",
                valueLabel: "Each cycle",
                rows: recurringMasters.map((master) => ({
                  id: master.id,
                  title: master.name,
                  subtitle: master.vendorOrEmployee ? `Payee · ${master.vendorOrEmployee}` : undefined,
                  detail: `Repeats · ${master.frequency}`,
                  value: formatExpenseCurrency(master.defaultAmount),
                })),
                empty: "No active recurring templates.",
              }
            : null;

  const registerPeriod = datePresetPeriodLabel(
    deferredFilters.datePreset,
    deferredFilters.dateFrom,
    deferredFilters.dateTo
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

  const handleDelete = async (transaction: ExpenseTransaction) => {
    const confirmed = window.confirm(`Delete expense "${transaction.name}"?`);
    if (!confirmed) return;
    setSaveError(null);
    try {
      await removeTransaction(transaction.id);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    }
  };

  const handleSave = (data: ExpenseTransactionFormData, attachment?: File | null) => {
    return (async () => {
      setSaveError(null);
      try {
        let expenseId = editingTransaction?.id;

        if (editingTransaction) {
          const newAmount = parseAmount(data.amount);
          if (
            editingTransaction.masterTemplateId &&
            editingTransaction.amount !== newAmount
          ) {
            if (attachment) {
              const payload = await fileToUploadPayload(attachment);
              await expensesApi.addFile(editingTransaction.id, payload);
              await refreshExpenses();
            }
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
        } else {
          const created = await addTransaction(data);
          expenseId = created.id;
          setEditingTransaction(undefined);
        }

        if (attachment && expenseId) {
          const payload = await fileToUploadPayload(attachment);
          await expensesApi.addFile(expenseId, payload);
          await refreshExpenses();
        }
      } catch (err) {
        setSaveError(getErrorMessage(err));
        throw err;
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
      startDate: toLocalIsoDate(),
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
          period={registerPeriod}
          onClick={() => setOpenStat("total")}
        />
        <StatCard
          label="Paid"
          value={formatExpenseCurrency(stats.paid)}
          icon={<IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={registerPeriod}
          onClick={() => setOpenStat("paid")}
        />
        <StatCard
          label="Pending"
          value={formatExpenseCurrency(stats.pending)}
          icon={<CalendarClock className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
          period={registerPeriod}
          onClick={() => setOpenStat("pending")}
        />
        <StatCard
          label="Upcoming Recurring"
          value={formatExpenseCurrency(stats.upcomingRecurring)}
          icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
          period={ALL_TIME}
          onClick={() => setOpenStat("recurring")}
        />
      </div>
      <StatDetailDialog
        open={statDetail !== null}
        title={statDetail?.title ?? ""}
        description={registerPeriod}
        nameLabel={statDetail?.nameLabel}
        valueLabel={statDetail?.valueLabel}
        rows={statDetail?.rows ?? []}
        empty={statDetail?.empty ?? ""}
        onOpenChange={(open) => {
          if (!open) setOpenStat(null);
        }}
      />

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
        onDelete={(transaction) => {
          void handleDelete(transaction);
        }}
        isFiltered={hasActiveFilters}
        isEmpty={liveTransactions.length === 0}
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
