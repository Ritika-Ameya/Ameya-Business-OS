import { Link } from "react-router-dom";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatInvoiceCurrency, getInvoicesByDealId } from "@/features/revenue/utils/invoice-utils";
import { formatPaymentCurrency, formatPaymentDate } from "@/features/revenue/utils/payment-utils";
import { Button } from "@/shared/ui/button";

interface DealPaymentsTabProps {
  dealId: string;
}

export function DealPaymentsTab({ dealId }: DealPaymentsTabProps) {
  const { getDeal } = useDeals();
  const { invoices, payments } = useRevenue();
  const deal = getDeal(dealId);
  const dealInvoices = getInvoicesByDealId(invoices, dealId);

  if (!deal) return null;

  const dealPayments = payments
    .filter((payment) => dealInvoices.some((invoice) => invoice.id === payment.invoiceId))
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const outstanding = dealInvoices.reduce((sum, invoice) => sum + invoice.outstanding, 0);
  const received = dealInvoices.reduce((sum, invoice) => sum + invoice.received, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Payment History</h3>
        {dealPayments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border/50">
            {dealPayments.map((payment) => {
              const invoice = dealInvoices.find((item) => item.id === payment.invoiceId);
              return (
                <div key={payment.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{formatPaymentCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice?.invoiceNo} · {formatPaymentDate(payment.paymentDate)}
                    </p>
                  </div>
                  {invoice && (
                    <Button variant="outline" size="sm" className="rounded-xl" asChild>
                      <Link to={`/invoices/${invoice.id}`}>Open</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Outstanding</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total Received</dt>
            <dd className="font-medium">{formatInvoiceCurrency(received)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Outstanding</dt>
            <dd className="font-medium text-amber-700 dark:text-amber-400">
              {formatInvoiceCurrency(outstanding)}
            </dd>
          </div>
        </dl>
        {dealInvoices.filter((inv) => inv.outstanding > 0).map((invoice) => (
          <div
            key={invoice.id}
            className="mt-4 flex items-center justify-between rounded-xl border border-border/50 bg-background/60 p-3 text-sm"
          >
            <div>
              <p className="font-medium">{invoice.invoiceNo}</p>
              <p className="text-xs text-muted-foreground">
                Due {formatPaymentDate(invoice.dueDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatInvoiceCurrency(invoice.outstanding)}</p>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link to={`/invoices/${invoice.id}?tab=payments`}>Record payment</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
