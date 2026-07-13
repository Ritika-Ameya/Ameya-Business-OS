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
import type { CountryFormData, SettingsCountry } from "@/features/settings/types/settings";

interface CountryMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: (data: CountryFormData) => void | Promise<void>;
  initialData?: SettingsCountry;
  saving?: boolean;
}

const emptyForm = (): CountryFormData => ({
  name: "",
  code: "",
  status: "active",
});

function formFromCountry(country?: SettingsCountry): CountryFormData {
  if (!country) return emptyForm();
  return { name: country.name, code: country.code, status: country.status };
}

export function CountryMasterDialog({
  open,
  onOpenChange,
  title,
  onSave,
  initialData,
  saving = false,
}: CountryMasterDialogProps) {
  const [form, setForm] = useState(() => formFromCountry(initialData));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(formFromCountry(initialData));
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
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
            <Label>Country Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Country Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="IN"
              maxLength={3}
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
                  status: value as CountryFormData["status"],
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
