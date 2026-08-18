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
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { Invoice } from "@/features/revenue/types/invoice";

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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoice) return;
    setDueDate(invoice.dueDate || "");
    setInvoiceNo(invoice.invoiceNo || "");
    setGstPercent(String(invoice.gstPercent ?? ""));
    setNotes(invoice.notes || "");
    setError(null);
  }, [open, invoice]);

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
    setSaving(true);
    setError(null);
    try {
      await updateInvoice(invoice.id, {
        invoiceNumber: invoiceNo.trim(),
        dueDate,
        taxPercent: Number.parseFloat(gstPercent) || 0,
        notes: notes.trim(),
      });
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
