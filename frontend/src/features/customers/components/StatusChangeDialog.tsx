import { useEffect, useState } from "react";
import type { CustomerStatus } from "@/features/customers/types/customer";
import { customerStatusLabels } from "@/features/customers/utils/customer-utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: CustomerStatus | null;
  onConfirm: (data: { notes?: string }) => void;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  status,
  onConfirm,
}: StatusChangeDialogProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const lost = status === "lost";

  useEffect(() => {
    if (!open) return;
    setNotes("");
    setError("");
  }, [open, status]);

  if (!status) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (lost && !notes.trim()) {
      setError("Remarks are required when marking as lost");
      return;
    }
    onConfirm({ notes: notes.trim() || undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as {customerStatusLabels[status]}</DialogTitle>
          <DialogDescription>
            {lost
              ? "Add remarks for why this opportunity was lost. The next action date is cleared."
              : `Update the status to ${customerStatusLabels[status]}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status-remarks">
              {lost ? "Remarks" : "Notes"}
              {lost ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Textarea
              id="status-remarks"
              value={notes}
              rows={3}
              placeholder={
                lost ? "Why was this opportunity lost?" : "Optional notes"
              }
              className="resize-none rounded-xl"
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setNotes(event.target.value);
                if (error) setError("");
              }}
            />
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
