import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { GenerateInvoiceDialog } from "@/components/invoices/GenerateInvoiceDialog";
import { InvoiceSearchFilters } from "@/components/invoices/InvoiceSearchFilters";
import { InvoiceStatsCards } from "@/components/invoices/InvoiceStatsCards";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { PageHeader } from "@/components/customers/PageHeader";
import { Button } from "@/components/ui/button";
import { seedInvoices } from "@/data/seed-invoices";
import { defaultInvoiceFilters, filterInvoices } from "@/lib/invoice-utils";
import type { InvoiceFilters } from "@/types/invoice";

export function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<InvoiceFilters>(defaultInvoiceFilters);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredInvoices = useMemo(
    () => filterInvoices(seedInvoices, query, filters),
    [query, filters]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        subtitle="Track all invoices across customers."
        action={
          <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus />
            Generate Invoice
          </Button>
        }
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

      <GenerateInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
