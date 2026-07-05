import { Badge } from "@/shared/ui/badge";
import { statusLabels, statusStyles } from "@/features/settings/utils/settings-utils";
import { cn } from "@/shared/utils";
import type { SettingsEntityStatus } from "@/features/settings/types/settings";

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
