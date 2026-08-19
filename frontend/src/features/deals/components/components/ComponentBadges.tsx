import { Badge } from "@/shared/ui/badge";
import {
  componentRenewalFrequencyLabels,
  componentRenewalFrequencyStyles,
  componentStatusLabels,
  componentStatusStyles,
  formatComponentDate,
} from "@/features/deals/utils/deal-component-utils";
import { cn } from "@/shared/utils";
import type {
  ComponentRenewalFrequency,
  ComponentStatus,
} from "@/features/deals/types/deal-component";

export function RenewalFrequencyBadge({
  frequency,
}: {
  frequency?: ComponentRenewalFrequency | "" | null;
}) {
  const value = frequency && frequency !== "none" ? frequency : "none";
  return (
    <Badge variant="secondary" className={cn(componentRenewalFrequencyStyles[value])}>
      {componentRenewalFrequencyLabels[value]}
    </Badge>
  );
}

export function ComponentStatusBadge({
  status,
  hasRenewal = false,
  dueDate,
}: {
  status: ComponentStatus;
  hasRenewal?: boolean;
  dueDate?: string;
}) {
  if (hasRenewal) {
    return (
      <Badge variant="secondary" className={cn(componentStatusStyles.pending)}>
        {dueDate ? `Due ${formatComponentDate(dueDate)}` : "Due"}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn(componentStatusStyles[status])}>
      {componentStatusLabels[status]}
    </Badge>
  );
}
