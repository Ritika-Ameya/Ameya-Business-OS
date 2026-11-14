import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import {
  EditReceiptPaymentDialog,
  type EditableReceiptPayment,
} from "@/features/canvas/components/EditReceiptPaymentDialog";
import { MarkReceiptPaidDialog } from "@/features/canvas/components/MarkReceiptPaidDialog";
import type { CanvasBoard, CanvasCard } from "@/features/canvas/types/canvas";
import { CustomerPaymentHistoryTable } from "@/features/customers/components/CustomerPaymentHistoryTable";
import {
  getCustomerPaymentHistory,
  type CustomerPaymentHistoryItem,
} from "@/features/customers/utils/customer-workspace-utils";
import { RecordPaymentDialog } from "@/features/revenue/components/invoices/payments/RecordPaymentDialog";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import type { Payment } from "@/features/revenue/types/payment";
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
import { toLocalIsoDate } from "@/shared/utils";

interface CustomerPaymentsTabProps {
  customer: Customer;
}

export function CustomerPaymentsTab({ customer }: CustomerPaymentsTabProps) {
  const { invoices, payments, loading, refreshInvoices } = useRevenue();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [editingInvoicePayment, setEditingInvoicePayment] = useState<Payment | null>(null);
  const [editingReceiptPayment, setEditingReceiptPayment] =
    useState<EditableReceiptPayment | null>(null);
  const [markPaidCard, setMarkPaidCard] = useState<CanvasCard | null>(null);
  const [receiptPayments, setReceiptPayments] = useState<CustomerPaymentHistoryItem[]>([]);
  const [openReceipts, setOpenReceipts] = useState<CanvasCard[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const today = toLocalIsoDate();

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
        receivedAccount: row.receivedAccount,
        editOutstanding: row.outstanding,
        billTotal: row.billTotal,
        beforeGst: row.beforeGst,
      }))
    );
  }, [customer.id]);

  const loadOpenReceipts = useCallback(async () => {
    const board = await canvasApi.getBoard();
    setOpenReceipts(
      board.cards.filter(
        (card) =>
          card.kind === "receipt" &&
          card.customerId === customer.id &&
          card.status === "expected" &&
          (card.expectedAmount ?? 0) > 0.009
      )
    );
  }, [customer.id]);

  useEffect(() => {
    let active = true;
    loadReceiptPayments().catch(() => {
      if (active) setReceiptPayments([]);
    });
    loadOpenReceipts().catch(() => {
      if (active) setOpenReceipts([]);
    });
    return () => {
      active = false;
    };
  }, [loadReceiptPayments, loadOpenReceipts]);

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
      await Promise.all([loadReceiptPayments(), loadOpenReceipts(), refreshInvoices()]);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (payment: CustomerPaymentHistoryItem) => {
    if (payment.source === "invoice") {
      const match = payments.find((item) => item.id === payment.paymentId);
      if (match) setEditingInvoicePayment(match);
      return;
    }
    if (!payment.receiptId || payment.receiptPaymentIndex == null) return;
    const siblings = receiptPayments.filter((item) => item.receiptId === payment.receiptId);
    const alreadyCut = siblings
      .filter((item) => item.paymentId !== payment.paymentId)
      .reduce((sum, item) => sum + (item.tdsAmount || 0), 0);
    const cashAlready = siblings
      .filter((item) => item.paymentId !== payment.paymentId)
      .reduce((sum, item) => sum + item.amount, 0);
    setEditingReceiptPayment({
      receiptId: payment.receiptId,
      index: payment.receiptPaymentIndex,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      mode: payment.mode,
      receivedAccount: payment.receivedAccount === "other" ? "other" : "gst",
      tdsAmount: payment.tdsAmount || 0,
      tdsSettles: Boolean(payment.tdsSettles),
      outstanding: payment.editOutstanding ?? payment.amount + (payment.tdsSettles ? payment.tdsAmount || 0 : 0),
      billTotal: payment.billTotal ?? payment.amount,
      beforeGst: payment.beforeGst ?? payment.billTotal ?? payment.amount,
      alreadyCut,
      cashAlready,
      reason: payment.reason,
    });
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
  const canRecord = payableInvoices.length > 0 || openReceipts.length > 0;

  const startPayment = () => {
    if (payableInvoices.length === 1 && openReceipts.length === 0) {
      setPayingInvoiceId(payableInvoices[0].id);
      return;
    }
    if (payableInvoices.length === 0 && openReceipts.length === 1) {
      setMarkPaidCard(openReceipts[0]);
      return;
    }
    setPickerOpen(true);
  };

  const recordButton = canRecord ? (
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
            {canRecord
              ? "Record a payment against an open invoice or expected receipt. It will show up here and on the Business Canvas."
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
            onEditPayment={startEdit}
            onDeleteReceiptPayment={(payment) => void deleteReceiptPayment(payment)}
          />
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What is this payment for?</DialogTitle>
            <DialogDescription>
              Pick an open invoice or expected receipt. The same payment shows on the Business Canvas.
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
                    Invoice · {invoice.dealTitle || "No deal"}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {formatInvoiceCurrency(invoice.outstanding)}
                </span>
              </button>
            ))}
            {openReceipts.map((card) => (
              <button
                key={card.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                onClick={() => {
                  setPickerOpen(false);
                  setMarkPaidCard(card);
                }}
              >
                <span>
                  <span className="block text-sm font-medium">
                    {card.reason || "Expected receipt"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Forecast · due {card.expectedDate}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {formatInvoiceCurrency(card.expectedAmount ?? 0)}
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

      <RecordPaymentDialog
        open={Boolean(editingInvoicePayment)}
        onOpenChange={(open) => {
          if (!open) setEditingInvoicePayment(null);
        }}
        invoiceId={editingInvoicePayment?.invoiceId ?? ""}
        maxAmount={
          invoices.find((invoice) => invoice.id === editingInvoicePayment?.invoiceId)?.outstanding
        }
        initialPayment={editingInvoicePayment}
      />

      <EditReceiptPaymentDialog
        payment={editingReceiptPayment}
        onOpenChange={(open) => {
          if (!open) setEditingReceiptPayment(null);
        }}
        onSaved={async () => {
          await Promise.all([loadReceiptPayments(), loadOpenReceipts(), refreshInvoices()]);
        }}
      />

      <MarkReceiptPaidDialog
        board={null}
        card={markPaidCard}
        today={today}
        onOpenChange={(open) => {
          if (!open) setMarkPaidCard(null);
        }}
        onBoard={async (_board: CanvasBoard) => {
          setMarkPaidCard(null);
          await Promise.all([loadReceiptPayments(), loadOpenReceipts(), refreshInvoices()]);
        }}
      />
    </>
  );
}
