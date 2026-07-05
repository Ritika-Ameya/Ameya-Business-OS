import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { AddComponentDialog } from "@/components/deals/components/AddComponentDialog";
import { DealComponentsEmptyState } from "@/components/deals/components/DealComponentsEmptyState";
import { DealComponentsTable } from "@/components/deals/components/DealComponentsTable";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/hooks/use-deals";

interface DealComponentsTabProps {
  dealId: string;
}

export function DealComponentsTab({ dealId }: DealComponentsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { getComponentsByDeal } = useDeals();
  const components = getComponentsByDeal(dealId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Deal Components"
        subtitle="Manage all billable components of this deal."
        action={
          <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus />
            Add Component
          </Button>
        }
      />

      {components.length === 0 ? (
        <DealComponentsEmptyState onAddComponent={() => setDialogOpen(true)} />
      ) : (
        <DealComponentsTable components={components} />
      )}

      <AddComponentDialog
        dealId={dealId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
