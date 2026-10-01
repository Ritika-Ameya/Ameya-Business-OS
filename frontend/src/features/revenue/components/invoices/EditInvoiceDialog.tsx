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
import { Textarea } from "@/shared/ui/textarea";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { BillingTypeToggle } from "@/features/revenue/components/invoices/BillingTypeToggle";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { InvoiceUpdateBody } from "@/features/revenue/api/revenue.dto";
import type { Invoice, InvoiceBillingType } from "@/features/revenue/types/invoice";

interface EditInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: EditInvoiceDialogProps) {
  const { updateInvoice } = useRevenue();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gstPercent, setGstPercent] = useState("");
  const [billingType, setBillingType] = useState<InvoiceBillingType>("gst");
  const [billingChangeReason, setBillingChangeReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoice) return;
    setDueDate(invoice.dueDate || "");
    setInvoiceNo(invoice.invoiceNo || "");
    setGstPercent(invoice.gstPercent > 0 ? String(invoice.gstPercent) : "18");
    setBillingType(invoice.billingType);
    setBillingChangeReason("");
    setNotes(invoice.notes || "");
    setError(null);
  }, [open, invoice]);

  const billingChanged = Boolean(invoice) && billingType !== invoice?.billingType;
  const isNonGst = billingType === "non_gst";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    if (!dueDate.trim()) {
      setError("Due date is required");
      return;
    }
    if (!invoiceNo.trim()) {
      setError("Invoice number is required");
      return;
    }
    if (billingChanged && !billingChangeReason.trim()) {
      setError("Give a reason for changing GST on this invoice");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const changes: InvoiceUpdateBody = {};
      if (billingChanged) {
        changes.billingType = billingType;
        changes.billingChangeReason = billingChangeReason.trim();
      }
      const nextInvoiceNo = invoiceNo.trim();
      if (nextInvoiceNo !== (invoice.invoiceNo || "")) {
        changes.invoiceNumber = nextInvoiceNo;
      }
      if (dueDate !== (invoice.dueDate || "")) {
        changes.dueDate = dueDate;
      }
      if (!isNonGst) {
        const nextGst = gstPercent.trim() === "" ? 0 : Number.parseFloat(gstPercent);
        const currentGst = invoice.gstPercent ?? 0;
        if (
          Number.isFinite(nextGst) &&
          (billingChanged || Math.round(nextGst * 100) !== Math.round(currentGst * 100))
        ) {
          changes.taxPercent = nextGst;
        }
      }
      const nextNotes = notes.trim();
      if (nextNotes !== (invoice.notes || "").trim()) {
        changes.notes = nextNotes;
      }
      if (Object.keys(changes).length > 0) {
        await updateInvoice(invoice.id, changes);
      }
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update due date, GST, or notes for {invoice?.invoiceNo}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-invoice-number">Invoice Number</Label>
            <Input
              id="edit-invoice-number"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="rounded-xl"
              disabled={saving}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-invoice-due">Due Date</Label>
            <Input
              id="edit-invoice-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label>GST on this invoice</Label>
            <BillingTypeToggle value={billingType} onChange={setBillingType} disabled={saving} />
          </div>
          {!isNonGst && (
            <div className="space-y-2">
              <Label htmlFor="edit-invoice-gst">GST %</Label>
              <Input
                id="edit-invoice-gst"
                type="number"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                className="rounded-xl"
                disabled={saving}
              />
            </div>
          )}
          {billingChanged && invoice && (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs">
                {isNonGst
                  ? `GST will be removed. Invoice total becomes ${formatInvoiceCurrency(
                      invoice.subtotal
                    )} (base amount).`
                  : "GST will be added on the base amount."}{" "}
                This is recorded on the invoice timeline.
              </p>
              <Label htmlFor="edit-invoice-gst-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-invoice-gst-reason"
                value={billingChangeReason}
                onChange={(e) => setBillingChangeReason(e.target.value)}
                placeholder="e.g. Client paid without GST to the other account"
                className="rounded-xl"
                disabled={saving}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-invoice-notes">Notes</Label>
            <Textarea
              id="edit-invoice-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
              rows={3}
              disabled={saving}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
