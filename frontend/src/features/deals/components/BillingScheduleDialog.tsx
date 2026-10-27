import { useEffect, useState } from "react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { useDeals } from "@/features/deals/hooks/use-deals";
import {
  computeComponentLineTotal,
  computeComponentTaxable,
} from "@/features/deals/utils/deal-component-utils";
import { getDealComponentRenewals } from "@/features/deals/utils/deal-utils";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatBaseWithGst } from "@/features/revenue/utils/invoice-utils";
import { formatTdsDeductionNote } from "@/features/revenue/utils/payment-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatCurrency, formatDate } from "@/shared/utils";

interface BillingScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  customerId?: string;
  dealId?: string;
}

interface ReceiptPayment {
  id: string;
  dealId: string;
  date: string;
  amount: number;
  reason: string;
  tdsAmount: number;
  tdsSettles: boolean;
}

export function BillingScheduleDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  customerId,
  dealId,
}: BillingScheduleDialogProps) {
  const { deals, components } = useDeals();
  const { invoices, payments } = useRevenue();
  const [receiptPayments, setReceiptPayments] = useState<ReceiptPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!open || !customerId) {
      setReceiptPayments([]);
      return;
    }
    let cancelled = false;
    setLoadingPayments(true);
    canvasApi
      .listCustomerReceiptPayments(customerId)
      .then((rows) => {
        if (cancelled) return;
        setReceiptPayments(
          rows.map((row) => ({
            id: `${row.receiptId}-${row.index}`,
            dealId: row.dealId,
            date: row.paymentDate,
            amount: row.amount,
            reason: row.reason,
            tdsAmount: row.tdsAmount,
            tdsSettles: row.tdsSettles,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setReceiptPayments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPayments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const dealIds = new Set(
    dealId
      ? [dealId]
      : deals.filter((deal) => deal.customerId === customerId).map((deal) => deal.id)
  );
  const dealTitle = new Map(deals.map((deal) => [deal.id, deal.title]));
  const schedule = (dealId ? [dealId] : [...dealIds]).flatMap((id) =>
    getDealComponentRenewals(id, components).map((item) => {
      const component = components.find((row) => row.id === item.id);
      const taxable = component ? computeComponentTaxable(component) : 0;
      const total = component ? computeComponentLineTotal(component) : 0;
      return {
        ...item,
        dealTitle: dealTitle.get(id) || "",
        amount: component ? formatBaseWithGst(taxable, total - taxable) : "",
      };
    })
  );

  const invoicePayments = payments
    .filter((payment) => payment.status === "received")
    .map((payment) => {
      const invoice = invoices.find((row) => row.id === payment.invoiceId);
      return { payment, invoice };
    })
    .filter((row) => {
      if (!row.invoice) return false;
      if (dealId) return row.invoice.dealId === dealId;
      return row.invoice.customerId === customerId;
    })
    .map((row) => ({
      id: row.payment.id,
      date: row.payment.paymentDate,
      amount: row.payment.amount,
      label: row.invoice?.invoiceNo || "Invoice",
      detail: row.invoice?.dealTitle || "",
      tdsAmount: row.payment.tdsAmount,
      tdsSettles: row.payment.tdsSettles,
    }));

  const forecastPayments = receiptPayments
    .filter((payment) => !dealId || payment.dealId === dealId)
    .map((payment) => ({
      id: payment.id,
      date: payment.date,
      amount: payment.amount,
      label: payment.reason || "Component payment",
      detail: payment.dealId ? dealTitle.get(payment.dealId) || "" : "",
      tdsAmount: payment.tdsAmount,
      tdsSettles: payment.tdsSettles,
    }));

  const history = [...invoicePayments, ...forecastPayments].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Components · {schedule.length}
          </h3>
          {schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment date is set.</p>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
              {schedule.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.lastPaidDate ? "Next renewal" : "First payment due"}
                      {item.dealTitle ? ` · ${item.dealTitle}` : ""}
                    </p>
                    {item.lastPaidDate ? (
                      <p className="text-xs text-muted-foreground">
                        Paid through {formatDate(item.lastPaidDate)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No payment yet</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatDate(item.dueDate)}</p>
                    {item.amount ? (
                      <p className="text-xs text-muted-foreground">{item.amount}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payments
          </h3>
          {loadingPayments ? (
            <p className="text-sm text-muted-foreground">Loading payments…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
              {history.map((payment) => {
                const tds = formatTdsDeductionNote(payment.tdsAmount, payment.tdsSettles);
                return (
                  <li key={payment.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{payment.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.date)}</p>
                      {payment.detail ? (
                        <p className="truncate text-xs text-muted-foreground">{payment.detail}</p>
                      ) : null}
                      {tds ? <p className="text-xs text-muted-foreground">{tds}</p> : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
