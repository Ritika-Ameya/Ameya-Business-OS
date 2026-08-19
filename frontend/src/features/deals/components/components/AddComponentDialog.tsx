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
  componentRenewalFrequencyLabels,
  componentStatusLabels,
  computeComponentFormTotal,
  formatComponentCurrency,
  formatComponentDate,
  getComponentCurrentDueDate,
  hasComponentRenewal,
  parseAmount,
  previewRenewalCyclePayment,
  previewRenewalCycleRollback,
  validateComponentForm,
} from "@/features/deals/utils/deal-component-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type {
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
  const { addComponent, updateComponent, undoComponentRenewal } = useDeals();
  const [form, setForm] = useState<ComponentFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ComponentFormData, string>>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = Boolean(initialComponent);

  const renewalEnabled = hasComponentRenewal(form.renewalFrequency);
  const isCustomRenewal = form.renewalFrequency === "custom";
  const unpaidCycleDate = form.renewalDate || getComponentCurrentDueDate({
    renewalStartDate: form.renewalStartDate,
    renewalDate: form.renewalDate,
    lastRenewedDate: initialComponent?.lastRenewedDate,
  });
  const renewalPaymentPreview = previewRenewalCyclePayment({
    renewalFrequency: form.renewalFrequency,
    renewalStartDate: form.renewalStartDate,
    renewalDate: form.renewalDate,
    lastRenewedDate: initialComponent?.lastRenewedDate,
  });

  const formFromComponent = (component: DealComponent): ComponentFormData => ({
    name: component.name,
    category: component.category || "",
    description: component.description || "",
    amount: String(component.amount ?? ""),
    gstPercent: component.gstPercent ? String(component.gstPercent) : "",
    quantity: String(component.quantity > 0 ? component.quantity : 1),
    discount: component.discount ? String(component.discount) : "",
    billingType: component.billingType,
    renewalFrequency:
      component.renewalFrequency === "none" ? "" : component.renewalFrequency,
    renewalStartDate: component.renewalStartDate || "",
    renewalDate: getComponentCurrentDueDate(component),
    status: hasComponentRenewal(component.renewalFrequency) ? "pending" : component.status,
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
      const payload = renewalEnabled ? { ...form, status: "pending" as ComponentStatus } : form;
      if (isEditing && initialComponent) {
        await updateComponent(dealId, initialComponent.id, payload);
      } else {
        await addComponent(dealId, payload);
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

  const handleMarkCyclePaid = async () => {
    if (!initialComponent) return;

    const validationErrors = validateComponentForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const paidForDate =
      renewalPaymentPreview?.paidForDate || unpaidCycleDate || form.renewalDate;
    const nextDueDate = renewalPaymentPreview?.nextDueDate;
    const confirmed = window.confirm(
      paidForDate && nextDueDate
        ? `Mark ${formatComponentDate(paidForDate)} as paid?\n\nLast paid cycle will become ${formatComponentDate(paidForDate)}. Next unpaid cycle will move to ${formatComponentDate(nextDueDate)}.`
        : paidForDate
          ? `Mark ${formatComponentDate(paidForDate)} as paid?\n\nIf this is a custom date, also set the next unpaid cycle after saving.`
          : "Mark the current unpaid cycle as paid?"
    );
    if (!confirmed) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await updateComponent(dealId, initialComponent.id, {
        ...form,
        status: "completed",
      });
      onOpenChange(false);
      setForm(emptyForm);
      setErrors({});
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUndoLastPayment = async () => {
    if (!initialComponent?.lastRenewedDate) return;
    const preview = previewRenewalCycleRollback(initialComponent);
    const confirmed = window.confirm(
      preview
        ? `Mark ${formatComponentDate(preview.unpaidDate)} as unpaid again?\n\nNext unpaid cycle will go back to ${formatComponentDate(preview.unpaidDate)}.`
        : "Undo the last paid renewal cycle?"
    );
    if (!confirmed) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await undoComponentRenewal(dealId, initialComponent.id);
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
        } else if (frequency !== "custom" && next.renewalStartDate && !initialComponent?.lastRenewedDate) {
          next.renewalDate = next.renewalStartDate;
        }
      }

      if (
        field === "renewalStartDate" &&
        next.renewalFrequency &&
        next.renewalFrequency !== "none" &&
        next.renewalFrequency !== "custom" &&
        !initialComponent?.lastRenewedDate
      ) {
        next.renewalDate = String(value);
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
              {errors.gstPercent && (
                <p className="text-xs text-destructive">{errors.gstPercent}</p>
              )}
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
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity}</p>
              )}
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
              {errors.discount && (
                <p className="text-xs text-destructive">{errors.discount}</p>
              )}
            </div>

            {parseAmount(form.amount) > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Amount (incl. GST)</p>
                <p className="text-sm font-medium">
                  {formatComponentCurrency(computeComponentFormTotal(form))}
                </p>
              </div>
            )}

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
                First renewal date
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

            {isCustomRenewal ? (
              <div className="space-y-2">
                <Label htmlFor="renewal-date">
                  Next unpaid cycle
                  <span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="renewal-date"
                  type="date"
                  value={form.renewalDate}
                  onChange={(e) => updateField("renewalDate", e.target.value)}
                  className="rounded-xl"
                  aria-invalid={Boolean(errors.renewalDate)}
                />
                {errors.renewalDate && (
                  <p className="text-xs text-destructive">{errors.renewalDate}</p>
                )}
              </div>
            ) : null}

            {renewalEnabled ? (
              <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Payment cycles</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The table Status badge is always for the next unpaid cycle
                    {unpaidCycleDate ? ` (${formatComponentDate(unpaidCycleDate)})` : ""}.
                    Last paid is already collected — it is not the unpaid status.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Next unpaid cycle</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {unpaidCycleDate ? formatComponentDate(unpaidCycleDate) : "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Still due</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Last paid cycle</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {initialComponent?.lastRenewedDate
                        ? formatComponentDate(initialComponent.lastRenewedDate)
                        : "None yet"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Already collected</p>
                  </div>
                </div>
                {errors.renewalDate && !isCustomRenewal ? (
                  <p className="text-xs text-destructive">{errors.renewalDate}</p>
                ) : null}

                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="rounded-xl"
                      disabled={saving || !unpaidCycleDate}
                      onClick={() => void handleMarkCyclePaid()}
                    >
                      Mark {unpaidCycleDate ? formatComponentDate(unpaidCycleDate) : "cycle"} as paid
                    </Button>
                    {initialComponent?.lastRenewedDate ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        disabled={saving}
                        onClick={() => void handleUndoLastPayment()}
                      >
                        Undo last payment
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Save this component first. After that you can mark a cycle paid, or
                    generate an invoice and mark that invoice paid.
                  </p>
                )}
              </div>
            ) : (
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
            )}
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
