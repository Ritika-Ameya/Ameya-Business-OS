import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatComponentCurrency } from "@/features/deals/utils/deal-component-utils";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { getInvoicesByDealId } from "@/features/revenue/utils/invoice-utils";
import { formatDate } from "@/shared/utils";

interface DealOverviewTabProps {
  dealId: string;
}

export function DealOverviewTab({ dealId }: DealOverviewTabProps) {
  const { getDeal, getComponentsByDeal } = useDeals();
  const { invoices } = useRevenue();
  const deal = getDeal(dealId);
  const components = getComponentsByDeal(dealId);
  const dealInvoices = getInvoicesByDealId(invoices, dealId);

  if (!deal) return null;

  const componentValue = components.reduce((sum, c) => sum + c.amount * (c.quantity ?? 1), 0);
  const invoicedAmount = dealInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const receivedAmount = dealInvoices.reduce((sum, inv) => sum + inv.received, 0);
  const outstandingAmount = dealInvoices.reduce((sum, inv) => sum + inv.outstanding, 0);
  const renewalComponents = components.filter((c) => c.renewalDate);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Deal Summary</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium capitalize">{deal.status.replace("-", " ")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Start Date</dt>
            <dd className="font-medium">{formatDate(deal.startDate)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Contract Value</dt>
            <dd className="font-medium">{formatComponentCurrency(deal.contractValue ?? 0)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Components</dt>
            <dd className="font-medium">{components.length}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Financial Summary</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Component Value</dt>
            <dd className="font-medium">{formatComponentCurrency(componentValue)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Invoiced</dt>
            <dd className="font-medium">{formatInvoiceCurrency(invoicedAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Received</dt>
            <dd className="font-medium">{formatInvoiceCurrency(receivedAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Outstanding</dt>
            <dd className="font-medium text-amber-700 dark:text-amber-400">
              {formatInvoiceCurrency(outstandingAmount)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Renewal Summary</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Deal Renewal</dt>
            <dd className="font-medium">{formatDate(deal.nextRenewal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Renewal Components</dt>
            <dd className="font-medium">{renewalComponents.length}</dd>
          </div>
          {renewalComponents.slice(0, 3).map((component) => (
            <div key={component.id} className="flex justify-between gap-4">
              <dt className="truncate text-muted-foreground">{component.name}</dt>
              <dd className="shrink-0 font-medium">{formatDate(component.renewalDate)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
