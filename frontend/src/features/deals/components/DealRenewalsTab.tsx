import { useDeals } from "@/features/deals/hooks/use-deals";
import { getCompanyRenewals } from "@/features/revenue/utils/revenue-utils";
import { formatDate } from "@/shared/utils";
import { formatComponentCurrency } from "@/features/deals/utils/deal-component-utils";

interface DealRenewalsTabProps {
  dealId: string;
}

export function DealRenewalsTab({ dealId }: DealRenewalsTabProps) {
  const { getDeal, deals, components } = useDeals();
  const deal = getDeal(dealId);
  const dealComponents = components.filter((c) => c.dealId === dealId && c.renewalDate);
  const renewals = getCompanyRenewals(deals, components).filter((r) => r.dealId === dealId);

  if (!deal) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Renewal Schedule</h3>
        <div className="mt-4 space-y-3">
          {deal.nextRenewal && (
            <div className="rounded-xl border border-border/50 bg-background/60 p-3 text-sm">
              <p className="font-medium">{deal.title}</p>
              <p className="text-muted-foreground">Deal renewal · {formatDate(deal.nextRenewal)}</p>
            </div>
          )}
          {dealComponents.map((component) => (
            <div
              key={component.id}
              className="rounded-xl border border-border/50 bg-background/60 p-3 text-sm"
            >
              <p className="font-medium">{component.name}</p>
              <p className="text-muted-foreground">
                {component.billingType} · {formatDate(component.renewalDate)}
              </p>
              <p className="mt-1 font-medium">{formatComponentCurrency(component.amount)}</p>
            </div>
          ))}
          {!deal.nextRenewal && dealComponents.length === 0 && (
            <p className="text-sm text-muted-foreground">No renewals scheduled.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Renewal History</h3>
        <div className="mt-4 space-y-3">
          {renewals.map((renewal) => (
            <div
              key={renewal.id}
              className="rounded-xl border border-border/50 bg-background/60 p-3 text-sm"
            >
              <p className="font-medium">{renewal.renewalLabel}</p>
              <p className="text-muted-foreground capitalize">{renewal.status}</p>
              <p className="mt-1">{renewal.amount}</p>
            </div>
          ))}
          {renewals.length === 0 && (
            <p className="text-sm text-muted-foreground">No renewal history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
