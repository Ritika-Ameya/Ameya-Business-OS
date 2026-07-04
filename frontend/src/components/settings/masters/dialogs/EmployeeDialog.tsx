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
import type { EmployeeFormData, SettingsEmployee } from "@/types/settings";

const emptyForm = (): EmployeeFormData => ({
  name: "",
  department: "",
  designation: "",
  status: "active",
});

function formFromEmployee(employee?: SettingsEmployee): EmployeeFormData {
  if (!employee) return emptyForm();
  return {
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    status: employee.status,
  };
}

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: EmployeeFormData) => void;
  initialData?: SettingsEmployee;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: EmployeeDialogProps) {
  const [form, setForm] = useState(() => formFromEmployee(initialData));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(formFromEmployee(initialData));
    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Employee Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <Input
              value={form.designation}
              onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
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
                  status: value as EmployeeFormData["status"],
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
