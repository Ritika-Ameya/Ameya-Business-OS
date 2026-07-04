import { useState } from "react";
import { InlineQuickCreate } from "@/components/expenses/InlineQuickCreate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { frequencyLabels } from "@/lib/expense-utils";
import type {
  EmployeeItem,
  ExpenseCategoryItem,
  ExpenseMasterFormData,
  ExpenseMasterTemplate,
  VendorItem,
} from "@/types/expense";

const emptyForm = (): ExpenseMasterFormData => ({
  name: "",
  categoryId: "",
  payeeType: "vendor",
  vendorOrEmployee: "",
  defaultAmount: "",
  frequency: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  autoGenerate: true,
  status: "active",
});

function formFromMaster(master?: ExpenseMasterTemplate): ExpenseMasterFormData {
  if (!master) return emptyForm();
  return {
    name: master.name,
    categoryId: master.categoryId,
    payeeType: master.payeeType,
    vendorOrEmployee: master.vendorOrEmployee,
    vendorId: master.vendorId,
    employeeId: master.employeeId,
    defaultAmount: String(master.defaultAmount),
    frequency: master.frequency,
    startDate: master.startDate,
    endDate: master.endDate ?? "",
    autoGenerate: master.autoGenerate,
    status: master.status,
  };
}

interface AddExpenseMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ExpenseMasterFormData) => void;
  categories: ExpenseCategoryItem[];
  vendors: VendorItem[];
  employees: EmployeeItem[];
  onCreateCategory: (name: string) => ExpenseCategoryItem;
  onCreateVendor: (name: string) => VendorItem;
  onCreateEmployee: (name: string) => EmployeeItem;
  initialData?: ExpenseMasterTemplate;
  presetName?: string;
}

export function AddExpenseMasterDialog({
  open,
  onOpenChange,
  onSave,
  categories,
  vendors,
  employees,
  onCreateCategory,
  onCreateVendor,
  onCreateEmployee,
  initialData,
  presetName,
}: AddExpenseMasterDialogProps) {
  const [form, setForm] = useState(() => ({
    ...formFromMaster(initialData),
    name: presetName ?? formFromMaster(initialData).name,
  }));

  const isEditing = Boolean(initialData);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm({ ...formFromMaster(initialData), name: presetName ?? formFromMaster(initialData).name });
    }
    onOpenChange(nextOpen);
  };

  const updateField = <K extends keyof ExpenseMasterFormData>(
    field: K,
    value: ExpenseMasterFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.categoryId || !form.defaultAmount.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "Add Expense Template"}</DialogTitle>
          <DialogDescription>
            Manage recurring expense templates for automatic register entries.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Expense Name</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category</Label>
              <InlineQuickCreate
                label="Category"
                onCreate={(name) => {
                  const category = onCreateCategory(name);
                  updateField("categoryId", category.id);
                }}
              />
            </div>
            <Select
              value={form.categoryId}
              onValueChange={(value) => updateField("categoryId", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Payee Type</Label>
              <Select
                value={form.payeeType}
                onValueChange={(value) =>
                  updateField("payeeType", value as ExpenseMasterFormData["payeeType"])
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{form.payeeType === "employee" ? "Employee" : "Vendor"}</Label>
                <InlineQuickCreate
                  label={form.payeeType === "employee" ? "Employee" : "Vendor"}
                  onCreate={(name) => {
                    if (form.payeeType === "employee") {
                      const employee = onCreateEmployee(name);
                      updateField("employeeId", employee.id);
                    } else {
                      const vendor = onCreateVendor(name);
                      updateField("vendorId", vendor.id);
                    }
                    updateField("vendorOrEmployee", name);
                  }}
                />
              </div>
              <Select
                value={
                  form.payeeType === "employee"
                    ? form.employeeId ?? form.vendorOrEmployee
                    : form.vendorId ?? form.vendorOrEmployee
                }
                onValueChange={(value) => {
                  if (form.payeeType === "employee") {
                    const employee = employees.find((item) => item.id === value);
                    updateField("employeeId", value);
                    updateField("vendorOrEmployee", employee?.name ?? value);
                  } else {
                    const vendor = vendors.find((item) => item.id === value);
                    updateField("vendorId", value);
                    updateField("vendorOrEmployee", vendor?.name ?? value);
                  }
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select payee" />
                </SelectTrigger>
                <SelectContent>
                  {(form.payeeType === "employee" ? employees : vendors).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Amount</Label>
              <Input
                type="number"
                min="0"
                value={form.defaultAmount}
                onChange={(e) => updateField("defaultAmount", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(value) =>
                  updateField("frequency", value as ExpenseMasterFormData["frequency"])
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Auto Generate</Label>
              <Select
                value={form.autoGenerate ? "yes" : "no"}
                onValueChange={(value) => updateField("autoGenerate", value === "yes")}
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
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", value as ExpenseMasterFormData["status"])
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
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={handleSave}>
            {isEditing ? "Save Changes" : "Add Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
