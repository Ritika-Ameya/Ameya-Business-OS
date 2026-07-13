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
import { Textarea } from "@/shared/ui/textarea";
import type { SettingsEntityStatus } from "@/features/settings/types/settings";

export interface NamedMasterForm {
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

interface NamedMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: (data: NamedMasterForm) => void | Promise<void>;
  initialData?: NamedMasterForm;
  saving?: boolean;
}

const emptyForm = (): NamedMasterForm => ({
  name: "",
  description: "",
  status: "active",
});

export function NamedMasterDialog({
  open,
  onOpenChange,
  title,
  onSave,
  initialData,
  saving = false,
}: NamedMasterDialogProps) {
  const [form, setForm] = useState<NamedMasterForm>(() => initialData ?? emptyForm());

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(initialData ?? emptyForm());
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-20 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
