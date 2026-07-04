import { Badge } from "@/shared/ui/badge";
import {
  billingTypeLabels,
  billingTypeStyles,
  componentStatusLabels,
  componentStatusStyles,
} from "@/lib/deal-component-utils";
import { cn } from "@/shared/utils";
import type { BillingType, ComponentStatus } from "@/types/deal-component";

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
