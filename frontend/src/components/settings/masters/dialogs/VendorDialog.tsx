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
import type { SettingsVendor, VendorFormData } from "@/types/settings";

const emptyForm = (): VendorFormData => ({
  name: "",
  category: "",
  contactPerson: "",
  phone: "",
  email: "",
  status: "active",
});

function formFromVendor(vendor?: SettingsVendor): VendorFormData {
  if (!vendor) return emptyForm();
  return {
    name: vendor.name,
    category: vendor.category,
    contactPerson: vendor.contactPerson,
    phone: vendor.phone,
    email: vendor.email,
    status: vendor.status,
  };
}

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: VendorFormData) => void;
  initialData?: SettingsVendor;
}

export function VendorDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: VendorDialogProps) {
  const [form, setForm] = useState(() => formFromVendor(initialData));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(formFromVendor(initialData));
    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Vendor Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input
              value={form.contactPerson}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, contactPerson: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
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
                  status: value as VendorFormData["status"],
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
