import { Layers } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

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
      description="Add a component billed one time, per month, or per year."
      actionLabel="Add Component"
      onAction={onAddComponent}
    />
  );
}
