import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { AddComponentDialog } from "@/features/deals/components/components/AddComponentDialog";
import { DealComponentsEmptyState } from "@/features/deals/components/components/DealComponentsEmptyState";
import { DealComponentsTable } from "@/features/deals/components/components/DealComponentsTable";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";

interface DealComponentsTabProps {
  dealId: string;
}

export function DealComponentsTab({ dealId }: DealComponentsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getComponentsByDeal, loadComponentsForDeal } = useDeals();
  const components = getComponentsByDeal(dealId);

  useEffect(() => {
    let cancelled = false;
    // Load components for this deal
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / deal change
    setLoading(true);
    void loadComponentsForDeal(dealId).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dealId, loadComponentsForDeal]);

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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading components…</p>
      ) : components.length === 0 ? (
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
