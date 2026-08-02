import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useDeals } from "@/features/deals/hooks/use-deals";
import {
  billingTypeLabels,
  componentRenewalFrequencyLabels,
  componentStatusLabels,
  computeComponentNextRenewal,
  hasComponentRenewal,
  validateComponentForm,
} from "@/features/deals/utils/deal-component-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type {
  BillingType,
  ComponentFormData,
  ComponentRenewalFrequency,
  ComponentStatus,
  DealComponent,
} from "@/features/deals/types/deal-component";

const emptyForm: ComponentFormData = {
  name: "",
  category: "",
  description: "",
  amount: "",
  gstPercent: "",
  quantity: "1",
  discount: "",
  billingType: "one-time",
  renewalFrequency: "",
  renewalStartDate: "",
  renewalDate: "",
  status: "pending",
};

interface AddComponentDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialComponent?: DealComponent | null;
}

export function AddComponentDialog({
  dealId,
  open,
  onOpenChange,
  initialComponent = null,
}: AddComponentDialogProps) {
  const { addComponent, updateComponent } = useDeals();
  const [form, setForm] = useState<ComponentFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ComponentFormData, string>>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = Boolean(initialComponent);

  const renewalEnabled = hasComponentRenewal(form.renewalFrequency);
  const isCustomRenewal = form.renewalFrequency === "custom";

  const formFromComponent = (component: DealComponent): ComponentFormData => ({
    name: component.name,
    category: component.category || "",
    description: component.description || "",
    amount: String(component.amount ?? ""),
    gstPercent: "",
    quantity: "1",
    discount: "",
    billingType: component.billingType,
    renewalFrequency:
      component.renewalFrequency === "none" ? "" : component.renewalFrequency,
    renewalStartDate: component.renewalStartDate || "",
    renewalDate: component.renewalDate || "",
    status: component.status,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(initialComponent ? formFromComponent(initialComponent) : emptyForm);
      setErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) return;
    setForm(initialComponent ? formFromComponent(initialComponent) : emptyForm);
    setErrors({});
    setSubmitError(null);
  }, [open, initialComponent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateComponentForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      if (isEditing && initialComponent) {
        await updateComponent(dealId, initialComponent.id, form);
      } else {
        await addComponent(dealId, form);
      }
      onOpenChange(false);
      setForm(emptyForm);
      setErrors({});
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof ComponentFormData>(
    field: K,
    value: ComponentFormData[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "renewalFrequency") {
        const frequency = value as ComponentRenewalFrequency | "";
        if (!frequency || frequency === "none") {
          next.renewalStartDate = "";
          next.renewalDate = "";
        } else if (frequency !== "custom" && next.renewalStartDate) {
          next.renewalDate = computeComponentNextRenewal(
            next.renewalStartDate,
            frequency
          );
        }
      }

      if (
        field === "renewalStartDate" &&
        next.renewalFrequency &&
        next.renewalFrequency !== "none" &&
        next.renewalFrequency !== "custom"
      ) {
        next.renewalDate = computeComponentNextRenewal(
          String(value),
          next.renewalFrequency
        );
      }

      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Component" : "Add Component"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this billable component and its renewal schedule."
              : "Add a billable component with its own renewal schedule."}
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
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
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
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
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
              <Label htmlFor="renewal-frequency">Renewal Frequency</Label>
              <Select
                value={form.renewalFrequency || "none"}
                onValueChange={(value) =>
                  updateField(
                    "renewalFrequency",
                    value === "none" ? "" : (value as ComponentRenewalFrequency)
                  )
                }
              >
                <SelectTrigger id="renewal-frequency" className="w-full rounded-xl">
                  <SelectValue placeholder="No renewal" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(componentRenewalFrequencyLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-start-date">
                Renewal Start Date
                {renewalEnabled ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>
              <Input
                id="renewal-start-date"
                type="date"
                value={form.renewalStartDate}
                onChange={(e) => updateField("renewalStartDate", e.target.value)}
                className="rounded-xl"
                disabled={!renewalEnabled}
                aria-invalid={Boolean(errors.renewalStartDate)}
              />
              {errors.renewalStartDate && (
                <p className="text-xs text-destructive">{errors.renewalStartDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-date">
                {isCustomRenewal ? "Custom Renewal Date" : "Next Renewal Date"}
                {isCustomRenewal ? <span className="text-destructive"> *</span> : null}
              </Label>
              <Input
                id="renewal-date"
                type="date"
                value={form.renewalDate}
                onChange={(e) => updateField("renewalDate", e.target.value)}
                className="rounded-xl"
                disabled={!renewalEnabled}
                readOnly={renewalEnabled && !isCustomRenewal}
                aria-invalid={Boolean(errors.renewalDate)}
              />
              {errors.renewalDate && (
                <p className="text-xs text-destructive">{errors.renewalDate}</p>
              )}
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

          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : isEditing
                  ? "Save Changes"
                  : "Save Component"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
