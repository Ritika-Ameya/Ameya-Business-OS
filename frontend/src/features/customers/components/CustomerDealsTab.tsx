import { Handshake } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DealTable } from "@/features/deals/components/DealTable";
import { EditDealDialog } from "@/features/deals/components/EditDealDialog";
import { GenerateInvoiceDialog } from "@/features/revenue/components/invoices/GenerateInvoiceDialog";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { getDealsByCustomerId } from "@/features/deals/utils/deal-utils";
import type { Customer } from "@/features/customers/types/customer";
import type { Deal } from "@/features/deals/types/deal";
import type { GenerateInvoiceContext } from "@/features/revenue/types/invoice";

interface CustomerDealsTabProps {
  customer: Customer;
}

export function CustomerDealsTab({ customer }: CustomerDealsTabProps) {
  const { deals, components, removeDeal } = useDeals();
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [invoicingDeal, setInvoicingDeal] = useState<Deal | null>(null);
  const customerDeals = getDealsByCustomerId(deals, customer.id);
  const createDealPath = `/customers/${customer.id}/deals/new`;
  const invoiceContext: GenerateInvoiceContext | undefined = invoicingDeal
    ? {
        customerId: invoicingDeal.customerId,
        customerName: invoicingDeal.customerName,
        dealId: invoicingDeal.id,
        dealTitle: invoicingDeal.title,
      }
    : undefined;

  const handleDelete = async (deal: Deal) => {
    const confirmed = window.confirm(
      `Delete deal "${deal.title}"?\n\nRelated components and deal documents will also be deleted.`
    );
    if (!confirmed) return;
    await removeDeal(deal.id);
  };

  if (customerDeals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center sm:py-10">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Handshake className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium">No Deals Yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first deal to start tracking revenue for this customer.
        </p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link to={createDealPath}>
            <Handshake />
            Create Deal
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="rounded-xl" asChild>
          <Link to={createDealPath}>
            <Handshake />
            Create Deal
          </Link>
        </Button>
      </div>
      <DealTable
        deals={customerDeals}
        components={components}
        onEdit={setEditingDeal}
        onGenerateInvoice={setInvoicingDeal}
        onDelete={(deal) => {
          void handleDelete(deal);
        }}
      />
      <EditDealDialog
        deal={editingDeal}
        open={Boolean(editingDeal)}
        onOpenChange={(open) => {
          if (!open) setEditingDeal(null);
        }}
      />
      <GenerateInvoiceDialog
        open={Boolean(invoicingDeal)}
        onOpenChange={(open) => {
          if (!open) setInvoicingDeal(null);
        }}
        context={invoiceContext}
      />
    </div>
  );
}
