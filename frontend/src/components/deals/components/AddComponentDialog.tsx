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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  billingTypeLabels,
  componentStatusLabels,
} from "@/lib/deal-component-utils";
import type { BillingType, ComponentFormData, ComponentStatus } from "@/types/deal-component";

const emptyForm: ComponentFormData = {
  name: "",
  category: "",
  description: "",
  amount: "",
  gstPercent: "",
  quantity: "1",
  discount: "",
  billingType: "one-time",
  renewalApplicable: false,
  renewalDate: "",
  status: "pending",
};

interface AddComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddComponentDialog({ open, onOpenChange }: AddComponentDialogProps) {
  const [form, setForm] = useState<ComponentFormData>(emptyForm);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(emptyForm);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    setForm(emptyForm);
  };

  const updateField = <K extends keyof ComponentFormData>(
    field: K,
    value: ComponentFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
          <DialogDescription>
            Add a billable component to this deal. This is a UI preview only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="component-name">
                Component Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="component-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Platform Maintenance"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="e.g. Support"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe this billable component..."
                rows={3}
                className="resize-none rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst">GST %</Label>
              <Input
                id="gst"
                type="number"
                value={form.gstPercent}
                onChange={(e) => updateField("gstPercent", e.target.value)}
                placeholder="18"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                placeholder="1"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                type="number"
                value={form.discount}
                onChange={(e) => updateField("discount", e.target.value)}
                placeholder="0"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-type">Billing Type</Label>
              <Select
                value={form.billingType}
                onValueChange={(value) =>
                  updateField("billingType", value as BillingType)
                }
              >
                <SelectTrigger id="billing-type" className="w-full rounded-xl">
                  <SelectValue placeholder="Select billing type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(billingTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-applicable">Renewal Applicable</Label>
              <Select
                value={form.renewalApplicable ? "yes" : "no"}
                onValueChange={(value) =>
                  updateField("renewalApplicable", value === "yes")
                }
              >
                <SelectTrigger id="renewal-applicable" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-date">Renewal Date</Label>
              <Input
                id="renewal-date"
                type="date"
                value={form.renewalDate}
                onChange={(e) => updateField("renewalDate", e.target.value)}
                className="rounded-xl"
                disabled={!form.renewalApplicable}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", value as ComponentStatus)
                }
              >
                <SelectTrigger id="status" className="w-full rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(componentStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit">Save Component</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
