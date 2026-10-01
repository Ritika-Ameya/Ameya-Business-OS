import { cn } from "@/shared/utils";
import type { InvoiceBillingType } from "@/features/revenue/types/invoice";

const OPTIONS: Array<{ value: InvoiceBillingType; label: string; hint: string }> = [
  { value: "gst", label: "With GST", hint: "GST is added to the base amount" },
  { value: "non_gst", label: "Without GST", hint: "Base amount only, no GST" },
];

export function BillingTypeToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: InvoiceBillingType;
  onChange: (value: InvoiceBillingType) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-2">
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
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="block text-xs text-muted-foreground">{option.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
