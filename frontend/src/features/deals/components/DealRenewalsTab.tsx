import { History, RefreshCw } from "lucide-react";
import { useDeals } from "@/features/deals/hooks/use-deals";
import {
  componentRenewalFrequencyLabels,
  formatComponentCurrency,
  formatComponentDate,
  hasComponentRenewal,
} from "@/features/deals/utils/deal-component-utils";
import type { Deal } from "@/features/deals/types/deal";

interface DealRenewalsTabProps {
  deal: Deal;
}

export function DealRenewalsTab({ deal }: DealRenewalsTabProps) {
  const { getComponentsByDeal } = useDeals();
  const renewingComponents = getComponentsByDeal(deal.id).filter(
    (component) =>
      hasComponentRenewal(component.renewalFrequency) &&
      Boolean(component.renewalDate)
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5 md:col-span-2">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
          <RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm font-medium">Component Renewal Schedules</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each component maintains its own renewal cadence
        </p>

        {renewingComponents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No renewing components on this deal. Add a renewal frequency when
            creating a component.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border/60 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/30 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Component</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Start</th>
                  <th className="px-3 py-2 font-medium">Frequency</th>
                  <th className="px-3 py-2 font-medium">Next Renewal</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {renewingComponents.map((component) => (
                  <tr key={component.id} className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium">
                      {component.name}
                      <p className="text-xs text-muted-foreground sm:hidden">
                        Start {formatComponentDate(component.renewalStartDate)}
                      </p>
                    </td>
                    <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                      {formatComponentDate(component.renewalStartDate)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {componentRenewalFrequencyLabels[component.renewalFrequency]}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatComponentDate(component.renewalDate)}
                    </td>
                    <td className="px-3 py-2">
                      {formatComponentCurrency(component.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5 md:col-span-2">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
          <History className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-medium">Renewal History</h3>
        <p className="mt-1 text-xs text-muted-foreground">Past renewals</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Previous renewals will be tracked here once the renewals history module is live.
        </p>
      </div>
    </div>
  );
}
