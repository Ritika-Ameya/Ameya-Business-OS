import { Badge } from "@/shared/ui/badge";
import { statusLabels, statusStyles } from "@/lib/settings-utils";
import { cn } from "@/shared/utils";
import type { SettingsEntityStatus } from "@/types/settings";

interface SettingsStatusBadgeProps {
  status: SettingsEntityStatus;
}

export function SettingsStatusBadge({ status }: SettingsStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("capitalize", statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
