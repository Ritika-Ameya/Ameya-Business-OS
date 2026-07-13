import { Handshake, RefreshCw, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "@/shared/utils";
import { renewalFrequencyLabels } from "@/features/deals/utils/deal-utils";
import type { Deal } from "@/features/deals/types/deal";

interface DealOverviewTabProps {
  deal: Deal;
}

export function DealOverviewTab({ deal }: DealOverviewTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
          <Handshake className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-medium">Deal Summary</h3>
        <p className="mt-1 text-xs text-muted-foreground">Core deal information</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Deal #</dt>
            <dd className="font-medium">{deal.dealNumber || "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="font-medium">
              <Link
                className="underline-offset-2 hover:underline"
                to={`/customers/${deal.customerId}`}
              >
                {deal.customerName}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{deal.dealType || "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Start</dt>
            <dd className="font-medium">{formatDate(deal.startDate)}</dd>
          </div>
          {deal.description && (
            <p className="pt-2 text-muted-foreground">{deal.description}</p>
          )}
        </dl>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
          <Wallet className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-medium">Financial Summary</h3>
        <p className="mt-1 text-xs text-muted-foreground">Revenue and collections</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Contract Value</dt>
            <dd className="font-medium">
              {formatCurrency(deal.contractValue ?? 0)} {deal.currency || "INR"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Probability</dt>
            <dd className="font-medium">{deal.probability ?? 0}%</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Components</dt>
            <dd className="font-medium">{deal.componentsCount}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
          <RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm font-medium">Renewal Summary</h3>
        <p className="mt-1 text-xs text-muted-foreground">Renewal schedule</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Frequency</dt>
            <dd className="font-medium">
              {deal.renewalFrequency
                ? renewalFrequencyLabels[deal.renewalFrequency]
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Next Renewal</dt>
            <dd className="font-medium">
              {deal.nextRenewal ? formatDate(deal.nextRenewal) : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
