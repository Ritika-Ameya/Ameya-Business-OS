import { Input } from "@/shared/ui/input";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import type { Invoice } from "@/features/revenue/types/invoice";

export const DEFAULT_REMOVE_GST_REASON = "Client paid without GST";

/** Shown when the amount entered equals the invoice's base amount, i.e. GST was not paid. */
export function PaidWithoutGstPrompt({
  invoice,
  checked,
  onCheckedChange,
  reason,
  onReasonChange,
  disabled = false,
}: {
  invoice: Invoice;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
      <p>
        This amount matches the base amount of {formatInvoiceCurrency(invoice.subtotal)}. Did the
        client pay without GST?
      </p>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span>
          Yes, change this invoice to <strong>without GST</strong>. Total becomes{" "}
          {formatInvoiceCurrency(invoice.subtotal)} and nothing stays due.
        </span>
      </label>
      {checked ? (
        <Input
          aria-label="Reason for removing GST"
          value={reason}
          disabled={disabled}
          onChange={(event) => onReasonChange(event.target.value)}
          className="rounded-xl bg-background"
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Leave unticked to keep GST: the {formatInvoiceCurrency(invoice.tax)} GST stays due.
        </p>
      )}
    </div>
  );
}
