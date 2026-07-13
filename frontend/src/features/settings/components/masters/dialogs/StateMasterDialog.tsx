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
import type { SettingsCountry, SettingsState, StateFormData } from "@/features/settings/types/settings";

interface StateMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  countries: SettingsCountry[];
  onSave: (data: StateFormData) => void | Promise<void>;
  initialData?: SettingsState;
  saving?: boolean;
}

const emptyForm = (countryId = ""): StateFormData => ({
  name: "",
  code: "",
  countryId,
  status: "active",
});

function formFromState(state?: SettingsState): StateFormData {
  if (!state) return emptyForm();
  return {
    name: state.name,
    code: state.code,
    countryId: state.countryId,
    status: state.status,
  };
}

export function StateMasterDialog({
  open,
  onOpenChange,
  title,
  countries,
  onSave,
  initialData,
  saving = false,
}: StateMasterDialogProps) {
  const defaultCountryId = countries.find((c) => c.status === "active")?.id ?? countries[0]?.id ?? "";
  const [form, setForm] = useState(() =>
    initialData ? formFromState(initialData) : emptyForm(defaultCountryId)
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(initialData ? formFromState(initialData) : emptyForm(defaultCountryId));
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.countryId) return;
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
            <Label>State Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>State Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="MH"
              maxLength={5}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={form.countryId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, countryId: value }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as StateFormData["status"],
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
