import { Plus, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { GenerateInvoiceDialog } from "@/features/revenue/components/invoices/GenerateInvoiceDialog";
import { InvoiceTableWithActions } from "@/features/revenue/components/invoices/InvoiceTableWithActions";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import type { Customer } from "@/features/customers/types/customer";
import type { GenerateInvoiceContext } from "@/features/revenue/types/invoice";

interface CustomerInvoicesTabProps {
  customer: Customer;
}

export function CustomerInvoicesTab({ customer }: CustomerInvoicesTabProps) {
  const { deals } = useDeals();
  const { getInvoicesByCustomerId } = useRevenue();
  const [generateOpen, setGenerateOpen] = useState(false);
  const customerInvoices = getInvoicesByCustomerId(customer.id);
  const customerDeals = useMemo(
    () => deals.filter((deal) => deal.customerId === customer.id),
    [deals, customer.id]
  );

  const context: GenerateInvoiceContext = {
    customerId: customer.id,
    customerName: customer.name,
  };

  const generateButton = (
    <Button
      className="rounded-xl"
      disabled={customerDeals.length === 0}
      onClick={() => setGenerateOpen(true)}
    >
      <Plus />
      Generate Invoice
    </Button>
  );

  return (
    <>
      {customerInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center sm:py-10">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <Receipt className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No invoices available</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {customerDeals.length === 0
              ? "Create a deal with components, then generate the invoice from here."
              : "Generate an invoice for this customer from one of their deals."}
          </p>
          <div className="mt-4">{generateButton}</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {customerDeals.length === 0 && (
              <p className="mr-auto text-sm text-muted-foreground">
                Add a deal with components before generating another invoice.
              </p>
            )}
            {generateButton}
          </div>
          <InvoiceTableWithActions invoices={customerInvoices} hideCustomerColumn />
        </div>
      )}
      <GenerateInvoiceDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        context={context}
      />
    </>
  );
}
