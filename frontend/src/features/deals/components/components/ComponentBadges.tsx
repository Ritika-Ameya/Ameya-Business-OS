import { Badge } from "@/shared/ui/badge";
import {
  billingTypeLabels,
  billingTypeStyles,
  componentStatusLabels,
  componentStatusStyles,
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

export function ComponentStatusBadge({ status }: { status: ComponentStatus }) {
  return (
    <Badge variant="secondary" className={cn(componentStatusStyles[status])}>
      {componentStatusLabels[status]}
    </Badge>
  );
}
