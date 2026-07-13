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
import type { ExpenseCategoryFormData, SettingsExpenseCategory } from "@/features/settings/types/settings";

const emptyForm = (): ExpenseCategoryFormData => ({
  name: "",
  description: "",
  status: "active",
});

function formFromCategory(category?: SettingsExpenseCategory): ExpenseCategoryFormData {
  if (!category) return emptyForm();
  return {
    name: category.name,
    description: category.description,
    status: category.status,
  };
}

interface ExpenseCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ExpenseCategoryFormData) => void | Promise<void>;
  initialData?: SettingsExpenseCategory;
  saving?: boolean;
}

export function ExpenseCategoryDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  saving = false,
}: ExpenseCategoryDialogProps) {
  const [form, setForm] = useState(() => formFromCategory(initialData));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(formFromCategory(initialData));
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
          <DialogTitle>
            {initialData ? "Edit Expense Category" : "Add Expense Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Category Name</Label>
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
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
                  status: value as ExpenseCategoryFormData["status"],
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
