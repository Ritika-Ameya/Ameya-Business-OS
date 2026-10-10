import { useDeferredValue, useMemo, useState } from "react";
import { invoicesApi } from "@/features/revenue/api/invoices.api";
import { InvoiceSearchFilters } from "@/features/revenue/components/invoices/InvoiceSearchFilters";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { InvoiceStatsCards } from "@/features/revenue/components/invoices/InvoiceStatsCards";
import { RevenueInvoicesTable } from "@/features/revenue/components/RevenueInvoicesTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import {
  defaultInvoiceFilters,
  filterInvoices,
  sortInvoicesByNumber,
} from "@/features/revenue/utils/invoice-utils";
import type { InvoiceFilters, InvoiceNumberSort } from "@/features/revenue/types/invoice";

export function RevenueInvoicesTab() {
  const { invoices, loading: invoicesLoading, error } = useRevenue();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<InvoiceFilters>(defaultInvoiceFilters);
  const [numberSort, setNumberSort] = useState<InvoiceNumberSort>("asc");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const deferredFilters = useDeferredValue(filters);

  const loading =
    invoicesLoading || query !== deferredQuery || filters !== deferredFilters;

  const filteredInvoices = useMemo(() => {
    const filtered = filterInvoices(invoices, deferredQuery, deferredFilters);
    return sortInvoicesByNumber(filtered, numberSort);
  }, [invoices, deferredQuery, deferredFilters, numberSort]);

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.status !== defaultInvoiceFilters.status ||
    filters.customer !== defaultInvoiceFilters.customer ||
    filters.date !== defaultInvoiceFilters.date ||
    filters.dateFrom !== defaultInvoiceFilters.dateFrom ||
    filters.dateTo !== defaultInvoiceFilters.dateTo ||
    filters.billingType !== defaultInvoiceFilters.billingType;

  const downloadFiltered = async () => {
    setExporting(true);
    setExportError("");
    try {
      await invoicesApi.downloadFiles(filteredInvoices.map((invoice) => invoice.id));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "The invoices could not be downloaded.");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultInvoiceFilters);
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading ? <StatsSkeleton /> : <InvoiceStatsCards invoices={invoices} />}
      <InvoiceSearchFilters
        invoices={invoices}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loading || exporting || filteredInvoices.length === 0}
          onClick={() => setConfirmOpen(true)}
        >
          {exporting
            ? "Preparing zip…"
            : hasActiveFilters
              ? `Download ${filteredInvoices.length} invoice${filteredInvoices.length === 1 ? "" : "s"}`
              : "Download all invoices"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Downloads the attached files for the invoices in this view, in one zip.
        </p>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download invoices</DialogTitle>
            <DialogDescription>
              {hasActiveFilters
                ? `Are you sure you want to download these ${filteredInvoices.length} invoice${filteredInvoices.length === 1 ? "" : "s"}?`
                : "Are you sure you want to download all invoices?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                void downloadFiltered();
              }}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {exportError ? (
        <p role="alert" className="text-sm text-destructive">
          {exportError}
        </p>
      ) : null}
      {loading ? (
        <TableSkeleton />
      ) : (
        <RevenueInvoicesTable
          invoices={filteredInvoices}
          isFiltered={hasActiveFilters}
          onResetFilters={resetFilters}
          numberSort={numberSort}
          onNumberSortChange={setNumberSort}
        />
      )}
    </div>
  );
}
