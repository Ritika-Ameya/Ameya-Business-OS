import { useState } from "react";
import { InvoiceTable } from "@/features/revenue/components/invoices/InvoiceTable";
import { EditInvoiceDialog } from "@/features/revenue/components/invoices/EditInvoiceDialog";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceTableWithActionsProps {
  invoices: Invoice[];
  isFiltered?: boolean;
  onResetFilters?: () => void;
  hideCustomerColumn?: boolean;
}

/** Shared invoice table with edit/delete wired to revenue context. */
export function InvoiceTableWithActions({
  invoices,
  isFiltered,
  onResetFilters,
  hideCustomerColumn,
}: InvoiceTableWithActionsProps) {
  const { removeInvoice } = useRevenue();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleDelete = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Delete invoice "${invoice.invoiceNo}"?\n\nRelated payments will also be removed.`
    );
    if (!confirmed) return;
    await removeInvoice(invoice.id);
  };

  return (
    <>
      <InvoiceTable
        invoices={invoices}
        isFiltered={isFiltered}
        onResetFilters={onResetFilters}
        hideCustomerColumn={hideCustomerColumn}
        onEdit={setEditingInvoice}
        onDelete={(invoice) => {
          void handleDelete(invoice);
        }}
      />
      <EditInvoiceDialog
        invoice={editingInvoice}
        open={Boolean(editingInvoice)}
        onOpenChange={(open) => {
          if (!open) setEditingInvoice(null);
        }}
      />
    </>
  );
}
