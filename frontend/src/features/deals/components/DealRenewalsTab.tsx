import { History, RefreshCw } from "lucide-react";
import { useDeals } from "@/features/deals/hooks/use-deals";
import {
  componentRenewalFrequencyLabels,
  computeComponentLineTotal,
  formatComponentCurrency,
  formatComponentDate,
  getComponentCurrentDueDate,
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
      Boolean(getComponentCurrentDueDate(component))
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5 md:col-span-2">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
          <RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm font-medium">Component Renewal Schedules</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Last paid is the cycle already collected. Next unpaid is the cycle still due.
          Open the component and tap Mark that date as paid, or fully pay a linked
          invoice. If a cycle was marked paid by mistake, use Undo last payment.
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
                  <th className="px-3 py-2 font-medium">Last paid</th>
                  <th className="px-3 py-2 font-medium">Next unpaid</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {renewingComponents.map((component) => {
                  const dueDate = getComponentCurrentDueDate(component);
                  const lastRenewed = component.lastRenewedDate?.trim();
                  return (
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
                      {lastRenewed ? formatComponentDate(lastRenewed) : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatComponentDate(dueDate)}
                    </td>
                    <td className="px-3 py-2">
                      {formatComponentCurrency(computeComponentLineTotal(component))}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5 md:col-span-2">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
          <History className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-medium">Paid cycles</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each row is the last cycle date that was marked paid for that component
        </p>
        {renewingComponents.some((component) => component.lastRenewedDate) ? (
          <ul className="mt-4 space-y-2 text-sm">
            {renewingComponents
              .filter((component) => component.lastRenewedDate)
              .map((component) => (
                <li
                  key={component.id}
                  className="flex flex-wrap justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
                >
                  <span className="font-medium">{component.name}</span>
                  <span className="text-muted-foreground">
                    Paid for {formatComponentDate(component.lastRenewedDate)} · Next unpaid{" "}
                    {formatComponentDate(getComponentCurrentDueDate(component))}
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No paid cycles yet. Open the component and tap Mark that date as paid, or
            generate an invoice for it and mark that invoice paid.
          </p>
        )}
      </div>
    </div>
  );
}
