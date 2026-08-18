import { Badge } from "@/shared/ui/badge";
import {
  billingTypeLabels,
  billingTypeStyles,
  componentStatusLabels,
  componentStatusStyles,
  renewalComponentStatusLabels,
} from "@/features/deals/utils/deal-component-utils";
import { cn } from "@/shared/utils";
import type { BillingType, ComponentStatus } from "@/features/deals/types/deal-component";

export function BillingTypeBadge({ type }: { type: BillingType }) {
  return (
    <Badge variant="secondary" className={cn(billingTypeStyles[type])}>
      {billingTypeLabels[type]}
    </Badge>
  );
}

export function ComponentStatusBadge({
  status,
  hasRenewal = false,
}: {
  status: ComponentStatus;
  hasRenewal?: boolean;
}) {
  const labels = hasRenewal ? renewalComponentStatusLabels : componentStatusLabels;
  return (
    <Badge variant="secondary" className={cn(componentStatusStyles[status])}>
      {labels[status]}
    </Badge>
  );
}
