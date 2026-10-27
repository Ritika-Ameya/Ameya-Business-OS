import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { CustomerPaymentHistoryTable } from "@/features/customers/components/CustomerPaymentHistoryTable";
import {
  getCustomerPaymentHistory,
  type CustomerPaymentHistoryItem,
} from "@/features/customers/utils/customer-workspace-utils";
import { RecordPaymentDialog } from "@/features/revenue/components/invoices/payments/RecordPaymentDialog";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { formatPaymentCurrency } from "@/features/revenue/utils/payment-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
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
  const [receiptPayments, setReceiptPayments] = useState<CustomerPaymentHistoryItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadReceiptPayments = useCallback(async () => {
    const rows = await canvasApi.listCustomerReceiptPayments(customer.id);
    setReceiptPayments(
      rows.map((row) => ({
        paymentId: `${row.receiptId}-${row.index}`,
        invoiceId: "",
        invoiceNo: "Expected receipt",
        dealId: row.dealId,
        dealTitle: row.dealTitle,
        paymentDate: row.paymentDate,
        amount: row.amount,
        mode: row.mode,
        status: "received",
        source: "expected_receipt" as const,
        receiptId: row.receiptId,
        receiptPaymentIndex: row.index,
        reason: row.reason,
        tdsAmount: row.tdsAmount,
        tdsSettles: row.tdsSettles,
      }))
    );
  }, [customer.id]);

  useEffect(() => {
    let active = true;
    loadReceiptPayments().catch(() => {
      if (active) setReceiptPayments([]);
    });
    return () => {
      active = false;
    };
  }, [loadReceiptPayments]);

  const deleteReceiptPayment = async (payment: CustomerPaymentHistoryItem) => {
    if (!payment.receiptId || payment.receiptPaymentIndex == null) return;
    const confirmed = window.confirm(
      `Delete this expected receipt payment of ${formatPaymentCurrency(payment.amount)}?\n\nIt is not on an invoice. Received drops by this cash, and the forecast shows the amount again.`
    );
    if (!confirmed) return;
    setDeletingId(payment.paymentId);
    setActionError(null);
    try {
      await canvasApi.removeReceiptPayment(payment.receiptId, payment.receiptPaymentIndex);
      await loadReceiptPayments();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const paymentHistory = useMemo(
    () =>
      [...getCustomerPaymentHistory(customer.id, invoices, payments), ...receiptPayments].sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      ),
    [customer.id, invoices, payments, receiptPayments]
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
      {actionError ? <p className="mb-3 text-sm text-destructive">{actionError}</p> : null}
      {loading && paymentHistory.length === 0 ? (
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
          <CustomerPaymentHistoryTable
            payments={paymentHistory}
            deletingId={deletingId}
            onDeleteReceiptPayment={(payment) => void deleteReceiptPayment(payment)}
          />
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
