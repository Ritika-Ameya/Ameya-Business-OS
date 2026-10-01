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
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { invoicesApi } from "@/features/revenue/api/invoices.api";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { fileToUploadPayload, toLocalIsoDate } from "@/shared/utils";
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import { isBaseOnlyPayment } from "@/features/revenue/utils/invoice-utils";
import {
  DEFAULT_REMOVE_GST_REASON,
  PaidWithoutGstPrompt,
} from "@/features/revenue/components/invoices/payments/PaidWithoutGstPrompt";
import { ReceivedAccountToggle } from "@/features/revenue/components/invoices/payments/ReceivedAccountToggle";
import type {
  Payment,
  PaymentAccount,
  PaymentFormData,
  PaymentMode,
} from "@/features/revenue/types/payment";

const emptyForm: PaymentFormData = {
  paymentDate: "",
  amount: "",
  mode: "upi",
  referenceNumber: "",
  receivedBy: "",
  transactionId: "",
  notes: "",
  receivedAccount: "gst",
};

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  maxAmount?: number;
  initialPayment?: Payment | null;
}

function formFromPayment(
  payment: Payment | null | undefined,
  fallbackMode: PaymentMode,
  defaultAccount: PaymentAccount
): PaymentFormData {
  if (!payment) {
    return {
      ...emptyForm,
      paymentDate: toLocalIsoDate(),
      mode: fallbackMode,
      receivedAccount: defaultAccount,
    };
  }
  return {
    paymentDate: payment.paymentDate,
    amount: String(payment.amount),
    mode: payment.mode,
    referenceNumber: payment.referenceNumber || "",
    receivedBy: payment.receivedBy || "",
    transactionId: payment.transactionId || "",
    notes: payment.notes || "",
    receivedAccount: payment.receivedAccount ?? defaultAccount,
  };
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  maxAmount,
  initialPayment = null,
}: RecordPaymentDialogProps) {
  const { paymentMethods } = useAppConfig();
  const { recordPayment, updatePayment, getInvoice } = useRevenue();
  const invoice = getInvoice(invoiceId);
  const activePaymentMethods = getActivePaymentMethods(paymentMethods);
  const fallbackMode = (activePaymentMethods[0]?.slug as PaymentMode) || "upi";
  const defaultAccount: PaymentAccount = invoice?.billingType === "non_gst" ? "other" : "gst";
  const [form, setForm] = useState<PaymentFormData>(() =>
    formFromPayment(initialPayment, fallbackMode, defaultAccount)
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeGst, setRemoveGst] = useState(false);
  const [removeGstReason, setRemoveGstReason] = useState(DEFAULT_REMOVE_GST_REASON);
  const isEditing = Boolean(initialPayment);

  useEffect(() => {
    if (!open) return;
    setForm(formFromPayment(initialPayment, fallbackMode, defaultAccount));
    setAttachmentFile(null);
    setError(null);
    setRemoveGst(false);
    setRemoveGstReason(DEFAULT_REMOVE_GST_REASON);
  }, [open, initialPayment, fallbackMode, defaultAccount]);

  const enteredAmount = Number.parseFloat(form.amount.replace(/,/g, ""));
  const showGstPrompt =
    !isEditing && invoice !== undefined && isBaseOnlyPayment(invoice, enteredAmount);

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
    if (!isEditing && maxAmount != null && amount > maxAmount + 0.001) {
      setError("Payment cannot exceed outstanding balance.");
      return;
    }
    const convertToNonGst = showGstPrompt && removeGst;
    if (convertToNonGst && !removeGstReason.trim()) {
      setError("Give a reason for removing GST.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && initialPayment) {
        await updatePayment(invoiceId, initialPayment.id, form);
      } else {
        await recordPayment(invoiceId, form, {
          removeGstReason: convertToNonGst ? removeGstReason.trim() : undefined,
        });
      }
      if (attachmentFile) {
        const payload = await fileToUploadPayload(attachmentFile);
        await invoicesApi.addFile(invoiceId, payload);
      }
      onOpenChange(false);
      setForm(emptyForm);
      setAttachmentFile(null);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "Record Payment"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this payment against the invoice."
              : "Record a payment received against this invoice."}
            {!isEditing && maxAmount != null
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

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Received in account <span className="text-destructive">*</span>
              </Label>
              <ReceivedAccountToggle
                value={form.receivedAccount}
                onChange={(value) => updateField("receivedAccount", value)}
                disabled={saving}
              />
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
                className="rounded-xl"
                disabled={saving}
                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                {attachmentFile
                  ? `Selected: ${attachmentFile.name}`
                  : "Optional proof of payment. Stored on the invoice documents. Max 6 MB."}
              </p>
            </div>
          </div>

          {showGstPrompt && invoice && (
            <PaidWithoutGstPrompt
              invoice={invoice}
              checked={removeGst}
              onCheckedChange={(checked) => {
                setRemoveGst(checked);
                updateField("receivedAccount", checked ? "other" : "gst");
              }}
              reason={removeGstReason}
              onReasonChange={setRemoveGstReason}
              disabled={saving}
            />
          )}

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
              {saving
                ? isEditing
                  ? "Saving…"
                  : "Recording…"
                : isEditing
                  ? "Save Changes"
                  : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
