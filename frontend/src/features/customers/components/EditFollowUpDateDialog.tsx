import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { formatDate } from "@/shared/utils/format-date";

interface EditFollowUpDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate?: string;
  entityLabel?: string;
  onSave: (data: { nextActionDate: string; notes?: string }) => void | Promise<void>;
}

export function EditFollowUpDateDialog({
  open,
  onOpenChange,
  currentDate,
  entityLabel = "record",
  onSave,
}: EditFollowUpDateDialogProps) {
  const [nextActionDate, setNextActionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNextActionDate(currentDate?.trim() || "");
    setNotes("");
    setError(null);
  }, [open, currentDate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nextActionDate.trim()) {
      setError("Follow-up date is required");
      return;
    }

    void (async () => {
      setSaving(true);
      setError(null);
      try {
        await onSave({
          nextActionDate: nextActionDate.trim(),
          notes: notes.trim() || undefined,
        });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update follow-up date");
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Follow-up Date</DialogTitle>
          <DialogDescription>
            Set the next action date for this {entityLabel}
            {currentDate ? ` (currently ${formatDate(currentDate)})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="follow-up-date">
              Next Action Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="follow-up-date"
              type="date"
              value={nextActionDate}
              onChange={(e) => {
                setNextActionDate(e.target.value);
                if (error) setError(null);
              }}
              className="rounded-xl"
              aria-invalid={Boolean(error)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow-up-notes">Notes (optional)</Label>
            <Textarea
              id="follow-up-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note about this follow-up..."
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Date"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
