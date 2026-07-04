import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { preventNestedOverlayDismiss } from "@/lib/dialog-utils";
import { frequencyLabels, validateTransactionForm } from "@/lib/expense-utils";
import { getActivePaymentMethods } from "@/lib/app-config-utils";
import { useAppConfig } from "@/hooks/use-app-config";
import type {
  ExpenseMasterTemplate,
  ExpenseTransaction,
  ExpenseTransactionFormData,
  ExpenseTransactionStatus,
} from "@/types/expense";
import type { EmployeeItem, ExpenseCategoryItem, VendorItem } from "@/types/expense";

const emptyForm = (): ExpenseTransactionFormData => ({
  date: new Date().toISOString().split("T")[0],
  categoryId: "",
  name: "",
  payeeType: "vendor",
  vendorOrEmployee: "",
  amount: "",
  status: "pending",
  paymentMethod: "",
  referenceNumber: "",
  notes: "",
  hasAttachment: false,
  recurring: false,
  createMaster: false,
  masterFrequency: "monthly",
  masterAutoGenerate: true,
});

function formFromTransaction(transaction?: ExpenseTransaction): ExpenseTransactionFormData {
  if (!transaction) return emptyForm();
  return {
    date: transaction.date,
    categoryId: transaction.categoryId,
    name: transaction.name,
    payeeType: transaction.payeeType,
    vendorOrEmployee: transaction.vendorOrEmployee,
    vendorId: transaction.vendorId,
    employeeId: transaction.employeeId,
    amount: String(transaction.amount),
    status: transaction.status,
    paymentMethod: transaction.paymentMethod ?? "",
    referenceNumber: transaction.referenceNumber ?? "",
    notes: transaction.notes ?? "",
    hasAttachment: transaction.hasAttachment,
    recurring: transaction.recurring,
  };
}

interface AddExpenseTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ExpenseTransactionFormData) => void;
  categories: ExpenseCategoryItem[];
  vendors: VendorItem[];
  employees: EmployeeItem[];
  masters: ExpenseMasterTemplate[];
  onCreateCategory: (name: string) => ExpenseCategoryItem;
  onCreateVendor: (name: string) => VendorItem;
  onCreateEmployee: (name: string) => EmployeeItem;
  onCreateMaster: (name: string) => void;
  initialData?: ExpenseTransaction;
}

export function AddExpenseTransactionDialog({
  open,
  onOpenChange,
  onSave,
  categories,
  vendors,
  employees,
  masters,
  onCreateCategory,
  onCreateVendor,
  onCreateEmployee,
  onCreateMaster,
  initialData,
}: AddExpenseTransactionDialogProps) {
  const { paymentMethods } = useAppConfig();
  const activePaymentMethods = getActivePaymentMethods(paymentMethods);
  const [form, setForm] = useState<ExpenseTransactionFormData>(() =>
    formFromTransaction(initialData)
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ExpenseTransactionFormData, string>>
  >({});

  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (!open) return;
    setForm(formFromTransaction(initialData));
    setErrors({});
  }, [open, initialData]);

  const updateField = <K extends keyof ExpenseTransactionFormData>(
    field: K,
    value: ExpenseTransactionFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const applyMaster = (masterId: string) => {
    const master = masters.find((item) => item.id === masterId);
    if (!master) return;
    setForm((prev) => ({
      ...prev,
      name: master.name,
      categoryId: master.categoryId,
      payeeType: master.payeeType,
      vendorOrEmployee: master.vendorOrEmployee,
      vendorId: master.vendorId,
      employeeId: master.employeeId,
      amount: String(master.defaultAmount),
      recurring: true,
    }));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateTransactionForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl"
        {...preventNestedOverlayDismiss}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            Record a business expense transaction. Required fields are marked implicitly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expense-date">Expense Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="rounded-xl"
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label htmlFor="expense-category">Category</Label>
              <InlineQuickCreate
                label="Category"
                onCreate={(name) => {
                  const category = onCreateCategory(name);
                  setForm((prev) => ({ ...prev, categoryId: category.id }));
                  setErrors((prev) => ({ ...prev, categoryId: undefined }));
                }}
              />
            </div>
            <Select
              value={form.categoryId}
              onValueChange={(value) => updateField("categoryId", value)}
            >
              <SelectTrigger id="expense-category" className="w-full rounded-xl">
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
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <Label htmlFor="expense-name">Expense Name</Label>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {masters.length > 0 && (
                  <Select onValueChange={applyMaster}>
                    <SelectTrigger size="sm" className="h-7 rounded-md text-xs">
                      <SelectValue placeholder="From template" />
                    </SelectTrigger>
                    <SelectContent>
                      {masters.map((master) => (
                        <SelectItem key={master.id} value={master.id}>
                          {master.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <InlineQuickCreate
                  label="Expense"
                  onCreate={(name) => {
                    onCreateMaster(name);
                    setForm((prev) => ({ ...prev, name }));
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
              </div>
            </div>
            <Input
              id="expense-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Jaya Salary"
              className="rounded-xl"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payee-type">Payee Type</Label>
            <Select
              value={form.payeeType}
              onValueChange={(value) =>
                updateField("payeeType", value as ExpenseTransactionFormData["payeeType"])
              }
            >
              <SelectTrigger id="payee-type" className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label>
                {form.payeeType === "employee" ? "Employee" : "Vendor"}
              </Label>
              <InlineQuickCreate
                label={form.payeeType === "employee" ? "Employee" : "Vendor"}
                onCreate={(name) => {
                  if (form.payeeType === "employee") {
                    const employee = onCreateEmployee(name);
                    setForm((prev) => ({
                      ...prev,
                      employeeId: employee.id,
                      vendorOrEmployee: name,
                    }));
                  } else {
                    const vendor = onCreateVendor(name);
                    setForm((prev) => ({
                      ...prev,
                      vendorId: vendor.id,
                      vendorOrEmployee: name,
                    }));
                  }
                  setErrors((prev) => ({ ...prev, vendorOrEmployee: undefined }));
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
              <SelectTrigger className="w-full rounded-xl">
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
            {errors.vendorOrEmployee && (
              <p className="text-xs text-destructive">{errors.vendorOrEmployee}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="25000"
              className="rounded-xl"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                updateField("status", value as ExpenseTransactionStatus)
              }
            >
              <SelectTrigger id="status" className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(value) =>
                updateField("paymentMethod", value as ExpenseTransactionFormData["paymentMethod"])
              }
            >
              <SelectTrigger id="payment-method" className="w-full rounded-xl">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {activePaymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.slug}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={form.referenceNumber}
              onChange={(e) => updateField("referenceNumber", e.target.value)}
              placeholder="REF-2026-001"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional notes..."
              className="min-h-20 rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="attachment">Attachment</Label>
            <Input
              id="attachment"
              type="file"
              disabled
              className="rounded-xl"
              title="Attachment upload placeholder"
            />
            <p className="text-xs text-muted-foreground">File upload placeholder (UI only)</p>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 p-4 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Recurring</Label>
                <p className="text-xs text-muted-foreground">
                  Create a recurring template from this expense
                </p>
              </div>
              <Select
                value={form.recurring ? "yes" : "no"}
                onValueChange={(value) => {
                  const recurring = value === "yes";
                  updateField("recurring", recurring);
                  updateField("createMaster", recurring);
                }}
              >
                <SelectTrigger className="w-24 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.recurring && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={form.masterFrequency}
                    onValueChange={(value) =>
                      updateField(
                        "masterFrequency",
                        value as ExpenseTransactionFormData["masterFrequency"]
                      )
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
                <div className="space-y-2">
                  <Label>Auto Generate</Label>
                  <Select
                    value={form.masterAutoGenerate ? "yes" : "no"}
                    onValueChange={(value) =>
                      updateField("masterAutoGenerate", value === "yes")
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
            )}
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl">
              {isEditing ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
