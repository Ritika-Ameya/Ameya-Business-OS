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
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import type { PaymentFormData, PaymentMode } from "@/features/revenue/types/payment";

const emptyForm = (outstanding?: number): PaymentFormData => ({
  paymentDate: new Date().toISOString().split("T")[0],
  amount: outstanding ? String(outstanding) : "",
  mode: "upi",
  referenceNumber: "",
  receivedBy: "",
  transactionId: "",
  notes: "",
});

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  outstanding: number;
  onRecord: (data: PaymentFormData) => boolean;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  outstanding,
  onRecord,
}: RecordPaymentDialogProps) {
  const { paymentMethods } = useAppConfig();
  const activePaymentMethods = getActivePaymentMethods(paymentMethods);
  const [form, setForm] = useState<PaymentFormData>(() => emptyForm(outstanding));
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(emptyForm(outstanding));
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number.parseFloat(form.amount.replace(/,/g, ""));
    if (!form.paymentDate) {
      setError("Payment date is required");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > outstanding) {
      setError(`Amount cannot exceed outstanding ${formatInvoiceCurrency(outstanding)}`);
      return;
    }

    const success = onRecord(form);
    if (!success) {
      setError("Unable to record payment. Please check the amount.");
      return;
    }

    onOpenChange(false);
    setForm(emptyForm(outstanding));
    setError(null);
  };

  const updateField = <K extends keyof PaymentFormData>(
    field: K,
    value: PaymentFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceId}. Outstanding:{" "}
            {formatInvoiceCurrency(outstanding)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                max={outstanding}
                className="rounded-xl"
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
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
