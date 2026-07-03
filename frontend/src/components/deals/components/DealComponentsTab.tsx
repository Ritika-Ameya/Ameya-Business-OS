import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/customers/PageHeader";
import { AddComponentDialog } from "@/components/deals/components/AddComponentDialog";
import { DealComponentsEmptyState } from "@/components/deals/components/DealComponentsEmptyState";
import { DealComponentsTable } from "@/components/deals/components/DealComponentsTable";
import { Button } from "@/components/ui/button";
import { seedDealComponents } from "@/data/seed-deal-components";
import { getComponentsByDealId } from "@/lib/deal-component-utils";

interface DealComponentsTabProps {
  dealId: string;
}

export function DealComponentsTab({ dealId }: DealComponentsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const components = getComponentsByDealId(seedDealComponents, dealId);

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

      <AddComponentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
