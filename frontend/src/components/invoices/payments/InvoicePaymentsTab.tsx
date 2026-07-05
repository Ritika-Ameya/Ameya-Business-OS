import { Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { RecordPaymentDialog } from "@/components/invoices/payments/RecordPaymentDialog";
import { PaymentTable } from "@/components/invoices/payments/PaymentTable";
import { Button } from "@/shared/ui/button";
import { seedPayments } from "@/data/seed-payments";
import { getPaymentsByInvoiceId } from "@/lib/payment-utils";

interface InvoicePaymentsTabProps {
  invoiceId: string;
}

export function InvoicePaymentsTab({ invoiceId }: InvoicePaymentsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const payments = getPaymentsByInvoiceId(seedPayments, invoiceId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        subtitle="Track all payments received against this invoice."
        action={
          <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus />
            Record Payment
          </Button>
        }
      />

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No Payments Recorded</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Payments recorded for this invoice will appear here.
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus />
            Record First Payment
          </Button>
        </div>
      ) : (
        <PaymentTable payments={payments} />
      )}

      <RecordPaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
