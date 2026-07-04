import { Calendar, Handshake, Layers, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { formatDate } from "@/lib/deal-utils";
import { cn } from "@/shared/utils";
import type { Deal, DealStatus } from "@/types/deal";

const statusStyles: Record<DealStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "on-hold": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

interface DealHeroProps {
  deal: Deal;
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold sm:text-base">{value}</p>
    </div>
  );
}

export function DealHero({ deal }: DealHeroProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("capitalize", statusStyles[deal.status])}
              >
                {deal.status.replace("-", " ")}
              </Badge>
              {deal.componentsCount > 0 && (
                <Badge variant="outline">
                  {deal.componentsCount}{" "}
                  {deal.componentsCount === 1 ? "component" : "components"}
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {deal.title}
              </h1>
              <Link
                to={`/customers/${deal.customerId}`}
                className="mt-1 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <User className="size-4" />
                {deal.customerName}
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Handshake className="size-4" />
                Deal workspace
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="size-4" />
                Started {formatDate(deal.startDate)}
              </span>
              {deal.nextRenewal && (
                <span className="flex items-center gap-2">
                  <Layers className="size-4" />
                  Renewal {formatDate(deal.nextRenewal)}
                </span>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-md lg:grid-cols-2">
            <HeroMetric label="Start Date" value={formatDate(deal.startDate)} />
            <HeroMetric label="Next Renewal" value={formatDate(deal.nextRenewal)} />
            <HeroMetric label="Components" value={String(deal.componentsCount)} />
            <HeroMetric label="Status" value={deal.status.replace("-", " ")} />
          </div>
        </div>
      </div>
    </div>
  );
}
