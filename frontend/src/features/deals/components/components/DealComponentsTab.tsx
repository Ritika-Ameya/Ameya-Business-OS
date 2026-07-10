import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { AddComponentDialog } from "@/features/deals/components/components/AddComponentDialog";
import { DealComponentsEmptyState } from "@/features/deals/components/components/DealComponentsEmptyState";
import { DealComponentsTable } from "@/features/deals/components/components/DealComponentsTable";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";
import type { DealComponent } from "@/features/deals/types/deal-component";

interface DealComponentsTabProps {
  dealId: string;
}

export function DealComponentsTab({ dealId }: DealComponentsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<DealComponent | undefined>();
  const [readOnly, setReadOnly] = useState(false);
  const { getComponentsByDeal, removeComponent, duplicateComponent } = useDeals();
  const components = getComponentsByDeal(dealId);

  const openDialog = (component?: DealComponent, viewOnly = false) => {
    setSelectedComponent(component);
    setReadOnly(viewOnly);
    setDialogOpen(true);
  };

  const handleAdd = () => openDialog(undefined, false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Deal Components"
        subtitle="Manage all billable components of this deal."
        action={
          <Button className="rounded-xl" onClick={handleAdd}>
            <Plus />
            Add Component
          </Button>
        }
      />

      {components.length === 0 ? (
        <DealComponentsEmptyState onAddComponent={handleAdd} />
      ) : (
        <DealComponentsTable
          components={components}
          onView={(component) => openDialog(component, true)}
          onEdit={(component) => openDialog(component, false)}
          onRemove={(component) => removeComponent(component.id)}
          onDuplicate={(component) => duplicateComponent(component.id)}
        />
      )}

      <AddComponentDialog
        key={`${selectedComponent?.id ?? "new"}-${dialogOpen}-${readOnly}`}
        dealId={dealId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialComponent={selectedComponent}
        readOnly={readOnly}
      />
    </div>
  );
}
