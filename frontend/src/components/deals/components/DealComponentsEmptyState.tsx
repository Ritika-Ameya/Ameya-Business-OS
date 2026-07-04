import { Layers } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface DealComponentsEmptyStateProps {
  onAddComponent: () => void;
}

export function DealComponentsEmptyState({
  onAddComponent,
}: DealComponentsEmptyStateProps) {
  return (
    <EmptyState
      icon={Layers}
      title="No components added"
      description="Start by adding the first billable component to this deal."
      actionLabel="Add Component"
      onAction={onAddComponent}
    />
  );
}
