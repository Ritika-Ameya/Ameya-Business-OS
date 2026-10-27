import { Check } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function TdsDeductionFields({
  tdsAmount,
  onTdsAmountChange,
  settles,
  onSettlesChange,
  disabled,
}: {
  tdsAmount: string;
  onTdsAmountChange: (value: string) => void;
  settles: boolean;
  onSettlesChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const tds = Number(tdsAmount.replace(/,/g, ""));
  const hasTds = Number.isFinite(tds) && tds > 0;

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
      <div className="space-y-1.5">
        <Label htmlFor="tds-amount">TDS deducted (optional)</Label>
        <Input
          id="tds-amount"
          inputMode="decimal"
          value={tdsAmount}
          disabled={disabled}
          placeholder="0"
          onChange={(event) => onTdsAmountChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave this blank when the client paid in full. The amount above is the cash that reached the bank, and that cash settles the bill. Fill this only when the client deducted TDS.
        </p>
      </div>
      {hasTds ? (
        <label className="flex items-start gap-2 text-sm">
          <span className="relative mt-0.5 inline-flex size-4 shrink-0">
            <input
              type="checkbox"
              className="size-4 appearance-none rounded-[3px] border border-neutral-400 bg-white shadow-none checked:border-primary checked:bg-primary disabled:opacity-50"
              checked={settles}
              disabled={disabled}
              onChange={(event) => onSettlesChange(event.target.checked)}
            />
            {settles ? (
              <Check className="pointer-events-none absolute inset-0 size-4 p-0.5 text-white" strokeWidth={3} />
            ) : null}
          </span>
          <span>
            Count this TDS toward the bill. The invoice can show as paid, and that remainder leaves
            To collect. Received still shows only the cash that reached the bank.
          </span>
        </label>
      ) : null}
    </div>
  );
}
