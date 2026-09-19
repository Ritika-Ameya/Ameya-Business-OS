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
import { isInactiveStage } from "@/features/customers/utils/stage-utils";

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

  const inactive = Boolean(stage && isInactiveStage(stage));

  useEffect(() => {
    if (!open) return;
    setNextActionDate(inactive ? "" : initialNextActionDate?.trim() || "");
    setNotes("");
    setErrors({});
  }, [open, initialNextActionDate, stage?.id, inactive]);

  const validate = (): boolean => {
    if (!stage) return false;

    const nextErrors: FormErrors = {};

    if (stage.dateRequired && !inactive && !nextActionDate.trim()) {
      nextErrors.nextActionDate = "Next action date is required for this stage";
    }
    if (stage.notesRequired && !notes.trim()) {
      nextErrors.notes = "Stage notes are required for this stage";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onConfirm({
      nextActionDate: inactive ? undefined : nextActionDate.trim() || undefined,
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
            {inactive
              ? "Inactive customers do not keep a next action date."
              : "Update follow-up details for this stage change."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {inactive ? null : (
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
              Stage Notes
              {stage.notesRequired ? (
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
              placeholder="Add notes about this stage change..."
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
