import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { useDeals } from "@/features/deals/hooks/use-deals";

interface DealNotesTabProps {
  dealId: string;
}

export function DealNotesTab({ dealId }: DealNotesTabProps) {
  const { getDeal, updateDealNotes } = useDeals();
  const deal = getDeal(dealId);
  const [notes, setNotes] = useState(deal?.notes ?? "");
  const [saved, setSaved] = useState(false);

  if (!deal) return null;

  const handleSave = () => {
    updateDealNotes(dealId, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Deal Notes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal notes about this deal.
        </p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          className="mt-4 resize-none rounded-xl"
          placeholder="Add notes about negotiations, scope changes, or follow-ups..."
        />
        <div className="mt-4 flex items-center gap-3">
          <Button className="rounded-xl" onClick={handleSave}>
            Save Notes
          </Button>
          {saved && <span className="text-sm text-emerald-600">Saved</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <h3 className="text-sm font-semibold">Note History</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          {deal.notes
            ? "Current saved notes are shown on the left. Timeline captures note updates."
            : "No notes saved yet."}
        </p>
      </div>
    </div>
  );
}
