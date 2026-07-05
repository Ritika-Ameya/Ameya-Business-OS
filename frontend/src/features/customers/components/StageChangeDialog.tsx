import { useState } from "react";
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

interface StageChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: SettingsStage | null;
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
  onConfirm,
}: StageChangeDialogProps) {
  const [nextActionDate, setNextActionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setNextActionDate("");
      setNotes("");
      setErrors({});
    }
    onOpenChange(nextOpen);
  };

  const validate = (): boolean => {
    if (!stage) return false;

    const nextErrors: FormErrors = {};

    if (stage.dateRequired && !nextActionDate.trim()) {
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
      nextActionDate: nextActionDate.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    handleOpenChange(false);
  };

  if (!stage) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to {stage.name}</DialogTitle>
          <DialogDescription>
            Complete the required details for this stage change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(stage.dateRequired || stage.notesRequired) && (
            <>
              {stage.dateRequired && (
                <div className="space-y-2">
                  <Label htmlFor="next-action-date">
                    Next Action Date <span className="text-destructive">*</span>
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

              {stage.notesRequired && (
                <div className="space-y-2">
                  <Label htmlFor="stage-notes">
                    Stage Notes <span className="text-destructive">*</span>
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
                    className="rounded-xl resize-none"
                  />
                  {errors.notes && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.notes}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!stage.dateRequired && !stage.notesRequired && (
            <p className="text-sm text-muted-foreground">
              Confirm moving this record to <strong>{stage.name}</strong>.
            </p>
          )}

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
