import { Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GenerateInvoiceDialog,
  type GenerateInvoiceFormData,
} from "@/features/revenue/components/invoices/GenerateInvoiceDialog";
import { InvoiceTable } from "@/features/revenue/components/invoices/InvoiceTable";
import { Button } from "@/shared/ui/button";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getInvoicesByDealId } from "@/features/revenue/utils/invoice-utils";
import type { GenerateInvoiceContext } from "@/features/revenue/types/invoice";

interface DealInvoicesTabProps {
  dealId: string;
}

export function DealInvoicesTab({ dealId }: DealInvoicesTabProps) {
  const navigate = useNavigate();
  const { getDeal, components } = useDeals();
  const { invoices, addInvoice } = useRevenue();
  const { finance, updateFinance } = useAppConfig();
  const [dialogOpen, setDialogOpen] = useState(false);

  const deal = getDeal(dealId);
  const dealInvoices = getInvoicesByDealId(invoices, dealId);

  if (!deal) {
    return null;
  }

  const context: GenerateInvoiceContext = {
    customerId: deal.customerId,
    customerName: deal.customerName,
    dealId: deal.id,
    dealTitle: deal.title,
  };

  const handleGenerate = (data: GenerateInvoiceFormData) => {
    const invoice = addInvoice(
      {
        customerId: deal.customerId,
        customerName: deal.customerName,
        dealId: deal.id,
        dealTitle: deal.title,
        componentIds: data.componentIds,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        gstPercent: data.gstPercent,
        notes: data.notes || undefined,
      },
      components,
      finance,
      updateFinance
    );
    navigate(`/invoices/${invoice.id}`);
  };

  if (dealInvoices.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <Receipt className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No invoices available</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Generate an invoice from this deal to start billing.
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus />
            Generate Invoice
          </Button>
        </div>
        <GenerateInvoiceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          context={context}
          onGenerate={handleGenerate}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus />
            Generate Invoice
          </Button>
        </div>
        <InvoiceTable invoices={dealInvoices} />
      </div>
      <GenerateInvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        context={context}
        onGenerate={handleGenerate}
      />
    </>
  );
}
