import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugifyName } from "@/lib/app-config-utils";
import type { SettingsEntityStatus } from "@/types/settings";

export interface SlugMasterForm {
  name: string;
  slug: string;
  status: SettingsEntityStatus;
}

interface SlugMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: (data: SlugMasterForm) => void;
  initialData?: SlugMasterForm;
}

const emptyForm = (): SlugMasterForm => ({
  name: "",
  slug: "",
  status: "active",
});

export function SlugMasterDialog({
  open,
  onOpenChange,
  title,
  onSave,
  initialData,
}: SlugMasterDialogProps) {
  const [form, setForm] = useState<SlugMasterForm>(() => initialData ?? emptyForm());

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(initialData ?? emptyForm());
    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      slug: form.slug.trim() || slugifyName(form.name),
    });
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
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                  slug: prev.slug || slugifyName(e.target.value),
                }))
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="auto-generated-from-name"
              className="rounded-xl"
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
          <Button className="rounded-xl" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
