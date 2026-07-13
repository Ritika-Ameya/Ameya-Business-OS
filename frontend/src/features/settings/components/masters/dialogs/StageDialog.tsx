import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  stageApplicableForLabels,
  stageColorOptions,
  stageReminderOffsetLabels,
} from "@/features/customers/utils/stage-utils";
import { statusLabels } from "@/features/settings/utils/settings-utils";
import type {
  SettingsEntityStatus,
  SettingsStage,
  StageApplicableFor,
  StageFormData,
  StageReminderOffset,
} from "@/features/settings/types/settings";

interface StageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: (data: StageFormData) => void | Promise<void>;
  initialData?: SettingsStage;
  nextSequence?: number;
  saving?: boolean;
}

const emptyForm = (nextSequence = 1): StageFormData => ({
  name: "",
  color: stageColorOptions[0].value,
  sequence: nextSequence,
  applicableFor: "both",
  dateRequired: false,
  notesRequired: false,
  reminderOffset: "1-day-before",
  status: "active",
});

function formFromStage(stage: SettingsStage): StageFormData {
  return {
    name: stage.name,
    color: stage.color,
    sequence: stage.sequence,
    applicableFor: stage.applicableFor,
    dateRequired: stage.dateRequired,
    notesRequired: stage.notesRequired,
    reminderOffset: stage.reminderOffset,
    status: stage.status,
  };
}

export function StageDialog({
  open,
  onOpenChange,
  title,
  onSave,
  initialData,
  nextSequence = 1,
  saving = false,
}: StageDialogProps) {
  const [form, setForm] = useState<StageFormData>(() =>
    initialData ? formFromStage(initialData) : emptyForm(nextSequence)
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(initialData ? formFromStage(initialData) : emptyForm(nextSequence));
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Stage Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={form.color}
                onValueChange={(value) => setForm((prev) => ({ ...prev, color: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageColorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: option.value }}
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sequence</Label>
              <Input
                type="number"
                min={1}
                value={form.sequence}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sequence: Number(e.target.value) || 1,
                  }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Applicable For</Label>
            <Select
              value={form.applicableFor}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  applicableFor: value as StageApplicableFor,
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stageApplicableForLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date Required</Label>
              <Select
                value={form.dateRequired ? "yes" : "no"}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, dateRequired: value === "yes" }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes Required</Label>
              <Select
                value={form.notesRequired ? "yes" : "no"}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, notesRequired: value === "yes" }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reminder Offset</Label>
            <Select
              value={form.reminderOffset}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  reminderOffset: value as StageReminderOffset,
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stageReminderOffsetLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Active</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as SettingsEntityStatus,
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
