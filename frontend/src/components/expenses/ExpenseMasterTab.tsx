import { Plus } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AddExpenseMasterDialog } from "@/components/expenses/AddExpenseMasterDialog";
import { ExpenseMasterFiltersBar } from "@/components/expenses/ExpenseMasterFiltersBar";
import { ExpenseMasterTable } from "@/components/expenses/ExpenseMasterTable";
import { TableSkeleton } from "@/components/shared/ListSkeleton";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/use-expenses";
import { defaultMasterFilters, filterMasters } from "@/lib/expense-utils";
import type { ExpenseMasterFormData, ExpenseMasterTemplate, ExpenseMasterFilters } from "@/types/expense";

export function ExpenseMasterTab() {
  const {
    masters,
    categories,
    vendors,
    employees,
    addMaster,
    updateMaster,
    addCategory,
    addVendor,
    addEmployee,
  } = useExpenses();

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ExpenseMasterFilters>(defaultMasterFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<ExpenseMasterTemplate | undefined>();

  const deferredQuery = useDeferredValue(query);
  const isSearching = query !== deferredQuery;

  const filteredMasters = useMemo(
    () => filterMasters(masters, deferredQuery, filters),
    [masters, deferredQuery, filters]
  );

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.category !== defaultMasterFilters.category ||
    filters.status !== defaultMasterFilters.status ||
    filters.frequency !== defaultMasterFilters.frequency;

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultMasterFilters);
  };

  const handleOpenAdd = () => {
    setEditingMaster(undefined);
    setDialogOpen(true);
  };

  const handleSave = (data: ExpenseMasterFormData) => {
    if (editingMaster) {
      updateMaster(editingMaster.id, data);
    } else {
      addMaster(data);
    }
    setEditingMaster(undefined);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingMaster(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Recurring expense templates auto-generate pending entries in the register.
        </p>
        <Button className="rounded-xl" onClick={handleOpenAdd}>
          <Plus />
          Add Template
        </Button>
      </div>

      <ExpenseMasterFiltersBar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />

      {isSearching ? (
        <TableSkeleton rows={5} />
      ) : (
        <ExpenseMasterTable
          masters={filteredMasters}
          categories={categories}
          onEdit={(master) => {
            setEditingMaster(master);
            setDialogOpen(true);
          }}
          isFiltered={hasActiveFilters}
          isEmpty={masters.length === 0}
          onAdd={handleOpenAdd}
          onResetFilters={resetFilters}
        />
      )}

      <AddExpenseMasterDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        onSave={handleSave}
        categories={categories}
        vendors={vendors}
        employees={employees}
        onCreateCategory={addCategory}
        onCreateVendor={addVendor}
        onCreateEmployee={addEmployee}
        initialData={editingMaster}
      />
    </div>
  );
}
