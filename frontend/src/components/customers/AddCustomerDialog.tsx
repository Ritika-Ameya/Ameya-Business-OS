import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { isValidEmail } from "@/lib/customer-utils";
import type { Customer, CustomerFormData } from "@/types/customer";

const emptyForm: CustomerFormData = {
  name: "",
  company: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
  notes: "",
};

function formFromCustomer(customer?: Customer): CustomerFormData {
  if (!customer) return emptyForm;
  return {
    name: customer.name,
    company: customer.company,
    phone: customer.phone,
    email: customer.email,
    gst: customer.gst ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
  };
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
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
          <DialogTitle>{isEditing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update customer details. Changes are saved locally."
              : "Add a new customer to your revenue management system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
                className="rounded-xl"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
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
                className="rounded-xl"
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
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
                className="rounded-xl"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={form.gst}
                onChange={(e) => updateField("gst", e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Business address"
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
