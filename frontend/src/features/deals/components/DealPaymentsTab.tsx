import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { CustomerPaymentHistoryTable } from "@/features/customers/components/CustomerPaymentHistoryTable";
import type { CustomerPaymentHistoryItem } from "@/features/customers/utils/customer-workspace-utils";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatPaymentCurrency } from "@/features/revenue/utils/payment-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { formatCurrency } from "@/shared/utils";
import type { Deal } from "@/features/deals/types/deal";

interface DealPaymentsTabProps {
  deal: Deal;
}

export function DealPaymentsTab({ deal }: DealPaymentsTabProps) {
  const { getComponentsByDeal } = useDeals();
  const { invoices, payments, loading } = useRevenue();
  const [receiptPayments, setReceiptPayments] = useState<CustomerPaymentHistoryItem[]>([]);
  const [receiptsReady, setReceiptsReady] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const componentIds = useMemo(
    () => new Set(getComponentsByDeal(deal.id).map((component) => component.id)),
    [deal.id, getComponentsByDeal]
  );

  const loadReceiptPayments = useCallback(async () => {
    if (!deal.customerId) {
      setReceiptPayments([]);
      setReceiptsReady(true);
      return;
    }
    const rows = await canvasApi.listCustomerReceiptPayments(deal.customerId);
    setReceiptPayments(
      rows
        .filter(
          (row) => row.dealId === deal.id || (row.componentId && componentIds.has(row.componentId))
        )
        .map((row) => ({
          paymentId: `${row.receiptId}-${row.index}`,
          invoiceId: "",
          invoiceNo: "Expected receipt",
          dealId: row.dealId || deal.id,
          dealTitle: row.dealTitle || deal.title,
          paymentDate: row.paymentDate,
          amount: row.amount,
          mode: row.mode,
          status: "received" as const,
          source: "expected_receipt" as const,
          receiptId: row.receiptId,
          receiptPaymentIndex: row.index,
          reason: row.reason,
          tdsAmount: row.tdsAmount,
          tdsSettles: row.tdsSettles,
        }))
    );
  }, [componentIds, deal.customerId, deal.id, deal.title]);

  useEffect(() => {
    let active = true;
    loadReceiptPayments()
      .catch(() => {
        if (active) setReceiptPayments([]);
      })
      .finally(() => {
        if (active) setReceiptsReady(true);
      });
    return () => {
      active = false;
    };
  }, [loadReceiptPayments]);

  const deleteReceiptPayment = async (payment: CustomerPaymentHistoryItem) => {
    if (!payment.receiptId || payment.receiptPaymentIndex == null) return;
    const confirmed = window.confirm(
      `Delete this payment of ${formatPaymentCurrency(payment.amount)}?\n\nIt leaves this deal and Business Canvas Received. The amount shows as due again.`
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

  const dealInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.dealId === deal.id ||
          (invoice.componentIds ?? []).some((id) => componentIds.has(id))
      ),
    [componentIds, deal.id, invoices]
  );
  const invoiceById = useMemo(
    () => new Map(dealInvoices.map((invoice) => [invoice.id, invoice])),
    [dealInvoices]
  );

  const history = useMemo(() => {
    const fromInvoices: CustomerPaymentHistoryItem[] = payments
      .filter((payment) => invoiceById.has(payment.invoiceId))
      .map((payment) => {
        const invoice = invoiceById.get(payment.invoiceId)!;
        return {
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          invoiceNo: invoice.invoiceNo,
          dealId: deal.id,
          dealTitle: deal.title,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          mode: payment.mode,
          status: payment.status,
          source: "invoice" as const,
          invoiceOutstanding: invoice.outstanding,
          tdsAmount: payment.tdsAmount,
          tdsSettles: payment.tdsSettles,
        };
      });
    return [...fromInvoices, ...receiptPayments].sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }, [deal.id, deal.title, invoiceById, payments, receiptPayments]);

  const received = history
    .filter((payment) => payment.status === "received")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = dealInvoices
    .filter((invoice) => invoice.status !== "cancelled")
    .reduce((sum, invoice) => sum + invoice.outstanding, 0);

  return (
    <div className="space-y-3">
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Received on this deal
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(received)}</p>
          <p className="text-xs text-muted-foreground">
            Every component, whether the cash was marked on the component, on the canvas, or on an invoice.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Still open on invoices
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(outstanding)}</p>
          <p className="text-xs text-muted-foreground">
            What invoices for this deal still have left to collect.
          </p>
        </div>
      </div>
      {(loading || !receiptsReady) && history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center sm:py-10">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No payment yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Mark a component paid, mark a canvas card received, or record a payment on an invoice.
            Any of those for a component on this deal shows up here.
          </p>
        </div>
      ) : (
        <CustomerPaymentHistoryTable
          payments={history}
          deletingId={deletingId}
          onDeleteReceiptPayment={(payment) => void deleteReceiptPayment(payment)}
        />
      )}
    </div>
  );
}
