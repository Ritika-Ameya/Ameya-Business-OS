import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { formatCurrency } from "@/shared/utils";

const round = (value: number) => Math.round(value * 100) / 100;
const TDS_RATE = 0.1;

export function tdsOnBillBeforeGst(beforeGst: number): number {
  if (!Number.isFinite(beforeGst) || beforeGst <= 0) return 0;
  return round(beforeGst * TDS_RATE);
}

/** Accepts "80", "2%", or "2.5 %". Percent uses the bill before GST. */
export function parseTdsInput(raw: string, beforeGst = 0): number {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return 0;
  const percentMatch = /^(\d+(?:\.\d+)?)\s*%$/.exec(trimmed);
  if (percentMatch) {
    const percent = Number(percentMatch[1]);
    if (!Number.isFinite(percent) || percent <= 0 || beforeGst <= 0) return 0;
    return round((beforeGst * percent) / 100);
  }
  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount > 0 ? round(amount) : 0;
}

function formatShare(amount: number, beforeGst: number): string {
  if (beforeGst <= 0 || amount <= 0) return "";
  const percent = Math.round((amount / beforeGst) * 1000) / 10;
  const label = Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
  return `${label}%`;
}

function percentFromAmount(amount: number, beforeGst: number): string {
  if (beforeGst <= 0 || amount <= 0) return "";
  const percent = Math.round((amount / beforeGst) * 1000) / 10;
  return Number.isInteger(percent) ? String(percent) : String(percent);
}

export function TdsDeductionFields({
  tdsAmount,
  onTdsAmountChange,
  settles,
  onSettlesChange,
  disabled,
  cash,
  outstanding,
  billTotal: _billTotal,
  beforeGst,
  alreadyCut = 0,
  cashAlready: _cashAlready = 0,
  installmentCount,
  thisInstallmentLabel,
}: {
  tdsAmount: string;
  onTdsAmountChange: (value: string) => void;
  settles: boolean;
  onSettlesChange: (value: boolean) => void;
  disabled?: boolean;
  /** Cash typed for this payment. */
  cash?: number;
  /** Bill still open, including GST, before this payment. */
  outstanding?: number;
  /** Full bill, including GST. */
  billTotal?: number;
  /** Full bill / deal base before GST. The 10% target uses this once. */
  beforeGst?: number;
  /** Tax already cut on earlier payments (including earlier installments). */
  alreadyCut?: number;
  /** Cash already received on earlier payments. */
  cashAlready?: number;
  /** When set, TDS is tracked across this many installments. */
  installmentCount?: number;
  /** e.g. Installment 1 of 3 — this payment only. */
  thisInstallmentLabel?: string;
}) {
  const base = Number.isFinite(beforeGst) ? Math.max(0, beforeGst ?? 0) : 0;
  const cutNow = parseTdsInput(tdsAmount, base);
  const cashNow = Number.isFinite(cash) ? Math.max(0, cash ?? 0) : 0;
  const priorCut = Number.isFinite(alreadyCut) ? Math.max(0, alreadyCut) : 0;
  const target = tdsOnBillBeforeGst(base);
  const cutSoFar = round(priorCut + cutNow);
  const stillToReach = round(Math.max(0, target - cutSoFar));
  const overTarget = cutSoFar > target + 0.009;
  const open =
    outstanding != null && Number.isFinite(outstanding) ? Math.max(0, outstanding) : null;
  const maxCounted =
    open != null ? round(Math.max(0, open - cashNow)) : null;
  const overBill =
    settles && maxCounted != null && cutNow > maxCounted + 0.009;
  const shareNow = formatShare(cutNow, base);
  const [percentText, setPercentText] = useState(() => percentFromAmount(cutNow, base));
  const editingRef = useRef<"amount" | "percent" | null>(null);

  useEffect(() => {
    if (editingRef.current === "percent") {
      editingRef.current = null;
      return;
    }
    setPercentText(percentFromAmount(parseTdsInput(tdsAmount, base), base));
  }, [tdsAmount, base]);

  const applyCut = (nextCut: number, amountText: string) => {
    onTdsAmountChange(amountText);
    if (nextCut > 0) onSettlesChange(true);
    else if (settles) onSettlesChange(false);
  };

  const changeAmount = (value: string) => {
    editingRef.current = "amount";
    const nextCut = parseTdsInput(value, base);
    setPercentText(percentFromAmount(nextCut, base));
    applyCut(nextCut, value);
  };

  const changePercent = (value: string) => {
    editingRef.current = "percent";
    setPercentText(value);
    const trimmed = value.trim().replace(/,/g, "");
    if (!trimmed) {
      applyCut(0, "");
      return;
    }
    const percent = Number(trimmed);
    if (!Number.isFinite(percent) || percent < 0 || base <= 0) return;
    const nextCut = percent > 0 ? round((base * percent) / 100) : 0;
    applyCut(nextCut, nextCut > 0 ? String(nextCut) : "");
  };

  const afterThisCut = round(priorCut + cutNow);
  const leftAfterThis = round(Math.max(0, target - afterThisCut));
  const tdsLeft = cutNow > 0 ? leftAfterThis : stillToReach;

  return (
    <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium">
          TDS
          {thisInstallmentLabel ? (
            <span className="ml-1 font-normal text-muted-foreground">· {thisInstallmentLabel}</span>
          ) : null}
        </p>
        {base > 0 && target > 0 ? (
          <p className="text-xs tabular-nums text-muted-foreground">
            10% of {formatCurrency(base)}
            {installmentCount && installmentCount > 1 ? ` · ${installmentCount} parts` : ""} ={" "}
            <span className="font-semibold text-foreground">{formatCurrency(target)}</span>
          </p>
        ) : null}
      </div>

      {base > 0 && target > 0 ? (
        <p className="text-xs tabular-nums text-muted-foreground">
          Final {formatCurrency(target)}
          <span className="mx-1.5 text-border">·</span>
          Cut {formatCurrency(afterThisCut)}
          <span className="mx-1.5 text-border">·</span>
          Left {formatCurrency(tdsLeft)}
          {overTarget ? (
            <span className="ml-1.5 font-medium text-destructive">over 10%</span>
          ) : null}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="tds-percent">%</Label>
          <div className="relative">
            <Input
              id="tds-percent"
              inputMode="decimal"
              aria-label="TDS percentage of full base before GST"
              placeholder="0"
              value={percentText}
              disabled={disabled || base <= 0}
              onChange={(event) => changePercent(event.target.value)}
              className="pr-8"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tds-amount">Amount</Label>
          <Input
            id="tds-amount"
            inputMode="decimal"
            aria-label="TDS amount cut on this payment"
            placeholder="0"
            value={tdsAmount}
            disabled={disabled}
            onChange={(event) => changeAmount(event.target.value)}
          />
        </div>
      </div>

      {cutNow > 0 ? (
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
            Reduce bill by this TDS
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Not bank cash — only settles the bill
              {shareNow ? ` · ${shareNow} of base` : ""}.
            </span>
          </span>
        </label>
      ) : null}

      {overBill && maxCounted != null ? (
        <p className="text-sm text-destructive" role="alert">
          Max counted TDS here: {formatCurrency(maxCounted)}.
        </p>
      ) : null}
    </div>
  );
}
