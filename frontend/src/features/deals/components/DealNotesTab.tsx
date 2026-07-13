import { useState } from "react";
import { dealsApi } from "@/features/deals/api/deals.api";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { formatDate } from "@/shared/utils";
import type { Deal } from "@/features/deals/types/deal";

interface DealNotesTabProps {
  deal: Deal;
}

export function DealNotesTab({ deal }: DealNotesTabProps) {
  const { refreshDeals } = useDeals();
  const [notes, setNotes] = useState(deal.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const noteHistory = deal.timeline.filter(
    (entry) =>
      entry.notes &&
      (entry.stageName === "Notes Added" || entry.action === "notes_added")
  );

  const handleSave = async () => {
    const trimmed = notes.trim();
    if (!trimmed) {
      setError("Notes are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await dealsApi.addTimelineNote(deal.id, { notes: trimmed });
      await refreshDeals();
      setSuccess("Notes saved");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/50 p-4">
        <div>
          <h3 className="text-sm font-medium">Deal Notes</h3>
          <p className="text-xs text-muted-foreground">Internal notes</p>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="resize-none rounded-xl"
          placeholder="Notes about this deal…"
          disabled={saving}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {success && <p className="text-sm text-emerald-600">{success}</p>}
        <Button className="rounded-xl" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save Notes"}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/50 p-4">
        <div>
          <h3 className="text-sm font-medium">Note History</h3>
          <p className="text-xs text-muted-foreground">Previous notes</p>
        </div>
        {noteHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            A history of notes will be maintained here.
          </p>
        ) : (
          <div className="space-y-3">
            {noteHistory.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border/50 bg-background/60 p-3"
              >
                <p className="text-sm">{entry.notes}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(entry.timestamp.split("T")[0])}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
