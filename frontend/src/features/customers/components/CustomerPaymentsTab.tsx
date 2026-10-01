import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { CustomerPaymentHistoryTable } from "@/features/customers/components/CustomerPaymentHistoryTable";
import { getCustomerPaymentHistory } from "@/features/customers/utils/customer-workspace-utils";
import { RecordPaymentDialog } from "@/features/revenue/components/invoices/payments/RecordPaymentDialog";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerPaymentsTabProps {
  customer: Customer;
}

export function CustomerPaymentsTab({ customer }: CustomerPaymentsTabProps) {
  const { invoices, payments, loading } = useRevenue();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const paymentHistory = useMemo(
    () => getCustomerPaymentHistory(customer.id, invoices, payments),
    [customer.id, invoices, payments]
  );

  const payableInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.customerId === customer.id &&
          invoice.status !== "cancelled" &&
          invoice.outstanding > 0
      ),
    [invoices, customer.id]
  );

  const payingInvoice = payableInvoices.find((invoice) => invoice.id === payingInvoiceId);

  const startPayment = () => {
    if (payableInvoices.length === 1) {
      setPayingInvoiceId(payableInvoices[0].id);
      return;
    }
    setPickerOpen(true);
  };

  const recordButton =
    payableInvoices.length > 0 ? (
      <Button className="rounded-xl" onClick={startPayment}>
        <Plus />
        Record Payment
      </Button>
    ) : null;

  return (
    <>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : paymentHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center sm:py-10">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No payment history</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {payableInvoices.length > 0
              ? "Record a payment against an open invoice. It will show up here."
              : "Payment records will be displayed here once recorded."}
          </p>
          {recordButton && <div className="mt-4">{recordButton}</div>}
        </div>
      ) : (
        <div className="space-y-3">
          {recordButton && <div className="flex justify-end">{recordButton}</div>}
          <CustomerPaymentHistoryTable payments={paymentHistory} />
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Which invoice?</DialogTitle>
            <DialogDescription>
              This customer has more than one open invoice. Pick the one this payment is for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {payableInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                onClick={() => {
                  setPickerOpen(false);
                  setPayingInvoiceId(invoice.id);
                }}
              >
                <span>
                  <span className="block text-sm font-medium">{invoice.invoiceNo}</span>
                  <span className="block text-xs text-muted-foreground">
                    {invoice.dealTitle || "No deal"}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {formatInvoiceCurrency(invoice.outstanding)}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        open={Boolean(payingInvoice)}
        onOpenChange={(open) => {
          if (!open) setPayingInvoiceId(null);
        }}
        invoiceId={payingInvoice?.id ?? ""}
        maxAmount={payingInvoice?.outstanding}
      />
    </>
  );
}
