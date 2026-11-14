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
import type { SettingsStage } from "@/features/settings/types/settings";
import {
  isClosedStage,
  isLostStage,
} from "@/features/customers/utils/stage-utils";

interface StageChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: SettingsStage | null;
  initialNextActionDate?: string;
  onConfirm: (data: { nextActionDate?: string; notes?: string }) => void;
}

interface FormErrors {
  nextActionDate?: string;
  notes?: string;
}

export function StageChangeDialog({
  open,
  onOpenChange,
  stage,
  initialNextActionDate,
  onConfirm,
}: StageChangeDialogProps) {
  const [nextActionDate, setNextActionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const closed = Boolean(stage && isClosedStage(stage));
  const lost = Boolean(stage && isLostStage(stage));
  const notesRequired = Boolean(stage?.notesRequired || lost);

  useEffect(() => {
    if (!open) return;
    setNextActionDate(closed ? "" : initialNextActionDate?.trim() || "");
    setNotes("");
    setErrors({});
  }, [open, initialNextActionDate, stage?.id, closed]);

  const validate = (): boolean => {
    if (!stage) return false;

    const nextErrors: FormErrors = {};

    if (stage.dateRequired && !closed && !nextActionDate.trim()) {
      nextErrors.nextActionDate = "Next action date is required for this stage";
    }
    if (notesRequired && !notes.trim()) {
      nextErrors.notes = lost
        ? "Remarks are required when marking as lost"
        : "Stage notes are required for this stage";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onConfirm({
      nextActionDate: closed ? undefined : nextActionDate.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  if (!stage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to {stage.name}</DialogTitle>
          <DialogDescription>
            {lost
              ? "Add remarks for why this opportunity was lost. The next action date is cleared."
              : closed
                ? "Inactive records do not keep a next action date."
                : "Update follow-up details for this stage change."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {closed ? null : (
          <div className="space-y-2">
            <Label htmlFor="next-action-date">
              Next Action Date
              {stage.dateRequired ? (
                <span className="text-destructive"> *</span>
              ) : null}
            </Label>
            <Input
              id="next-action-date"
              type="date"
              value={nextActionDate}
              onChange={(e) => {
                setNextActionDate(e.target.value);
                if (errors.nextActionDate) {
                  setErrors((prev) => ({ ...prev, nextActionDate: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.nextActionDate)}
              className="rounded-xl"
            />
            {errors.nextActionDate && (
              <p role="alert" className="text-xs text-destructive">
                {errors.nextActionDate}
              </p>
            )}
          </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stage-notes">
              {lost ? "Remarks" : "Stage Notes"}
              {notesRequired ? (
                <span className="text-destructive"> *</span>
              ) : null}
            </Label>
            <Textarea
              id="stage-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) {
                  setErrors((prev) => ({ ...prev, notes: undefined }));
                }
              }}
              placeholder={
                lost
                  ? "Why was this opportunity lost?"
                  : "Add notes about this stage change..."
              }
              rows={3}
              aria-invalid={Boolean(errors.notes)}
              className="resize-none rounded-xl"
            />
            {errors.notes && (
              <p role="alert" className="text-xs text-destructive">
                {errors.notes}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Stage Change</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
