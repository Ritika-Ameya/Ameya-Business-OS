import { Receipt } from "lucide-react";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { seedInvoices } from "@/data/seed-invoices";
import { getInvoicesByCustomerId } from "@/lib/invoice-utils";
import type { Customer } from "@/types/customer";

interface CustomerInvoicesTabProps {
  customer: Customer;
}

export function CustomerInvoicesTab({ customer }: CustomerInvoicesTabProps) {
  const customerInvoices = getInvoicesByCustomerId(seedInvoices, customer.id);

  if (customerInvoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Receipt className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium">No invoices available</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Invoices created for this customer will appear here.
        </p>
      </div>
    );
  }

  return <InvoiceTable invoices={customerInvoices} />;
}
