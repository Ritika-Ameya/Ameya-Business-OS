import { useMemo, useState } from "react";
import { InvoiceSearchFilters } from "@/components/invoices/InvoiceSearchFilters";
import { InvoiceStatsCards } from "@/components/invoices/InvoiceStatsCards";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { PageHeader } from "@/components/customers/PageHeader";
import { seedInvoices } from "@/data/seed-invoices";
import { defaultInvoiceFilters, filterInvoices } from "@/lib/invoice-utils";
import type { InvoiceFilters } from "@/types/invoice";

export function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<InvoiceFilters>(defaultInvoiceFilters);

  const filteredInvoices = useMemo(
    () => filterInvoices(seedInvoices, query, filters),
    [query, filters]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        subtitle="Track all invoices across customers."
      />

      <InvoiceStatsCards invoices={seedInvoices} />

      <InvoiceSearchFilters
        invoices={seedInvoices}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <InvoiceTable invoices={filteredInvoices} />
    </div>
  );
}
