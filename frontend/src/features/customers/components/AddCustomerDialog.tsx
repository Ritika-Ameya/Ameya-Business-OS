import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { isValidEmail } from "@/features/customers/utils/customer-utils";
import { recordTypeLabels } from "@/features/customers/utils/stage-utils";
import { isValidGstin } from "@/features/settings/utils/app-config-utils";
import type { Customer, CustomerFormData } from "@/features/customers/types/customer";

const emptyForm: CustomerFormData = {
  name: "",
  company: "",
  phone: "",
  email: "",
  gst: "",
  billingAddress: "",
  serviceAddress: "",
  notes: "",
  recordType: "opportunity",
};

function formFromCustomer(customer?: Customer): CustomerFormData {
  if (!customer) return emptyForm;
  return {
    name: customer.name,
    company: customer.company,
    phone: customer.phone,
    email: customer.email,
    gst: customer.gst ?? "",
    billingAddress: customer.billingAddress ?? customer.address ?? "",
    serviceAddress: customer.serviceAddress ?? customer.billingAddress ?? customer.address ?? "",
    notes: customer.notes ?? "",
    recordType: customer.recordType ?? "customer",
  };
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  gst?: string;
}

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CustomerFormData) => void;
  initialData?: Customer;
}

export function AddCustomerDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: AddCustomerDialogProps) {
  const [form, setForm] = useState(() => formFromCustomer(initialData));
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = Boolean(initialData);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(formFromCustomer(initialData));
      setErrors({});
    }
    onOpenChange(nextOpen);
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Customer name is required";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required";
    }
    if (!isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!isValidGstin(form.gst)) {
      nextErrors.gst = "Enter a valid 15-character GSTIN";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
    onOpenChange(false);
    setForm(emptyForm);
    setErrors({});
  };

  const updateField = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Opportunity / Customer" : "Add Opportunity / Customer"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update record details. Changes are saved locally."
              : "Add a new opportunity or customer to your pipeline."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="record-type">Record Type</Label>
              <Select
                value={form.recordType}
                onValueChange={(value) =>
                  updateField("recordType", value)
                }
              >
                <SelectTrigger id="record-type" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opportunity">
                    {recordTypeLabels.opportunity}
                  </SelectItem>
                  <SelectItem value="customer">{recordTypeLabels.customer}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Full name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="rounded-xl"
              />
              {errors.name && (
                <p id="name-error" role="alert" className="text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Company or business name"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 98765 43210"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className="rounded-xl"
              />
              {errors.phone && (
                <p id="phone-error" role="alert" className="text-xs text-destructive">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="email@company.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="rounded-xl"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="gst">GSTIN</Label>
              <Input
                id="gst"
                value={form.gst}
                onChange={(e) => updateField("gst", e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                aria-invalid={Boolean(errors.gst)}
                aria-describedby={errors.gst ? "gst-error" : undefined}
                className="rounded-xl"
              />
              {errors.gst && (
                <p id="gst-error" role="alert" className="text-xs text-destructive">
                  {errors.gst}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="billing-address">Billing Address</Label>
              <Input
                id="billing-address"
                value={form.billingAddress}
                onChange={(e) => updateField("billingAddress", e.target.value)}
                placeholder="Billing address for invoices"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service-address">Service Address</Label>
              <Input
                id="service-address"
                value={form.serviceAddress}
                onChange={(e) => updateField("serviceAddress", e.target.value)}
                placeholder="Service or delivery address"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional notes about this customer..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
