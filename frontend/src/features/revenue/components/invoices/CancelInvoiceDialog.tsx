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
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getErrorMessage } from "@/shared/api/getErrorMessage";

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNo: string;
}

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNo,
}: CancelInvoiceDialogProps) {
  const { cancelInvoice } = useRevenue();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setReason("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please provide a cancellation reason.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await cancelInvoice(invoiceId, trimmed);
      handleOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Invoice</DialogTitle>
          <DialogDescription>
            Cancel invoice {invoiceNo}? Cancelled invoices remain visible and cannot
            accept payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this invoice being cancelled?"
            className="min-h-24 rounded-xl"
            disabled={saving}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={saving}
            onClick={() => handleOpenChange(false)}
          >
            Keep Invoice
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={saving}
            onClick={() => void handleConfirm()}
          >
            {saving ? "Cancelling..." : "Confirm Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
