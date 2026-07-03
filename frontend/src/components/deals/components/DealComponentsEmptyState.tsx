import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DealComponentsEmptyStateProps {
  onAddComponent: () => void;
}

export function DealComponentsEmptyState({
  onAddComponent,
}: DealComponentsEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70",
        "bg-muted/10 px-6 py-16 text-center transition-colors"
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
        <Layers className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium">No Components Added</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Start by adding the first billable component.
      </p>
      <Button className="mt-6 rounded-xl" onClick={onAddComponent}>
        <Plus />
        Add Component
      </Button>
    </div>
  );
}
