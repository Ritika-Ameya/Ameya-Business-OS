import { cn } from "@/shared/utils";
import { PAYMENT_ACCOUNT_LABELS, type PaymentAccount } from "@/features/revenue/types/payment";

const OPTIONS: Array<{ value: PaymentAccount; hint: string }> = [
  { value: "gst", hint: "Account used for GST invoices" },
  { value: "other", hint: "Any other account (non-GST)" },
];

export function ReceivedAccountToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: PaymentAccount;
  onChange: (value: PaymentAccount) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Received in account" className="grid grid-cols-2 gap-2">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-60",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:bg-muted/50"
            )}
          >
            <span className="block text-sm font-medium">{PAYMENT_ACCOUNT_LABELS[option.value]}</span>
            <span className="block text-xs text-muted-foreground">{option.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
