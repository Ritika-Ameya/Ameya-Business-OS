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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import type { PaymentFormData, PaymentMode } from "@/features/revenue/types/payment";

const emptyForm: PaymentFormData = {
  paymentDate: "",
  amount: "",
  mode: "upi",
  referenceNumber: "",
  receivedBy: "",
  transactionId: "",
  notes: "",
};

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  maxAmount?: number;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  maxAmount,
}: RecordPaymentDialogProps) {
  const { paymentMethods } = useAppConfig();
  const { recordPayment } = useRevenue();
  const activePaymentMethods = getActivePaymentMethods(paymentMethods);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm({
        ...emptyForm,
        paymentDate: new Date().toISOString().split("T")[0]!,
        mode: (activePaymentMethods[0]?.slug as PaymentMode) || "upi",
      });
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paymentDate || !form.amount || !form.mode) {
      setError("Payment date, amount, and mode are required.");
      return;
    }
    const amount = Number.parseFloat(form.amount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    if (maxAmount != null && amount > maxAmount + 0.001) {
      setError("Payment cannot exceed outstanding balance.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await recordPayment(invoiceId, form);
      onOpenChange(false);
      setForm(emptyForm);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof PaymentFormData>(
    field: K,
    value: PaymentFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received against this invoice.
            {maxAmount != null
              ? ` Outstanding: ₹${maxAmount.toLocaleString("en-IN")}.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-date">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={form.paymentDate}
                onChange={(e) => updateField("paymentDate", e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payment-amount"
                type="number"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0"
                className="rounded-xl"
                required
                min={0}
                step="0.01"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-mode">
                Payment Mode <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.mode}
                onValueChange={(value) => updateField("mode", value as PaymentMode)}
              >
                <SelectTrigger id="payment-mode" className="w-full rounded-xl">
                  <SelectValue placeholder="Select payment mode" />
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
              <Label htmlFor="reference-number">Reference Number</Label>
              <Input
                id="reference-number"
                value={form.referenceNumber}
                onChange={(e) => updateField("referenceNumber", e.target.value)}
                placeholder="e.g. NEFT-884521"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="received-by">Received By</Label>
              <Input
                id="received-by"
                value={form.receivedBy}
                onChange={(e) => updateField("receivedBy", e.target.value)}
                placeholder="Name"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                value={form.transactionId}
                onChange={(e) => updateField("transactionId", e.target.value)}
                placeholder="Optional transaction reference"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional notes about this payment..."
                rows={3}
                className="resize-none rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="attachment">Attachment</Label>
              <Input
                id="attachment"
                type="file"
                disabled
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                File upload placeholder — metadata only in documents tab.
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
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
              {saving ? "Recording…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
