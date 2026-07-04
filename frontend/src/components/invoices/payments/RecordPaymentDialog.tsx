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
import { useAppConfig } from "@/hooks/use-app-config";
import { getActivePaymentMethods } from "@/lib/app-config-utils";
import type { PaymentFormData, PaymentMode } from "@/types/payment";

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
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const { paymentMethods } = useAppConfig();
  const activePaymentMethods = getActivePaymentMethods(paymentMethods);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);

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
            Record a payment received against this invoice. UI preview only.
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

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="attachment">Attachment</Label>
              <Input
                id="attachment"
                type="file"
                disabled
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                File upload placeholder — not functional in UI preview.
              </p>
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
            <Button type="submit">Record Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
