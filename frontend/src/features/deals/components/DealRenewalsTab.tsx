import { History, RefreshCw } from "lucide-react";
import { formatDate } from "@/shared/utils";
import { renewalFrequencyLabels } from "@/features/deals/utils/deal-utils";
import type { Deal } from "@/features/deals/types/deal";

interface DealRenewalsTabProps {
  deal: Deal;
}

export function DealRenewalsTab({ deal }: DealRenewalsTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
          <RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm font-medium">Renewal Schedule</h3>
        <p className="mt-1 text-xs text-muted-foreground">Upcoming renewals</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Frequency</dt>
            <dd className="font-medium">
              {deal.renewalFrequency
                ? renewalFrequencyLabels[deal.renewalFrequency]
                : "No Renewal"}
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

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
          <History className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-medium">Renewal History</h3>
        <p className="mt-1 text-xs text-muted-foreground">Past renewals</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Previous renewals will be tracked here once the renewals module is live.
        </p>
      </div>
    </div>
  );
}
