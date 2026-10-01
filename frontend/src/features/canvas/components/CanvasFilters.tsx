import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { PeriodPick, RangePreset } from "@/features/canvas/types/canvas";

const MONTH_OPTIONS: Array<{ value: RangePreset | "overdue"; label: string }> = [
  { value: "this-month", label: "This month" },
  { value: "next-month", label: "Next month" },
  { value: "last-month", label: "Last month" },
  { value: "month-after", label: "Month after" },
  { value: "rolling-3", label: "Next 3 months" },
  { value: "this-quarter", label: "This quarter" },
  { value: "next-quarter", label: "Next quarter" },
  { value: "month", label: "Pick a month" },
  { value: "quarter", label: "Pick a quarter" },
  { value: "all", label: "All months" },
  { value: "overdue", label: "Overdue" },
  { value: "custom", label: "Custom range" },
];

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(2000, index, 1))
);

const QUARTER_LABELS = ["Q1 · Jan–Mar", "Q2 · Apr–Jun", "Q3 · Jul–Sep", "Q4 · Oct–Dec"];

export function CanvasFilters({
  query,
  preset,
  overdue,
  customFrom,
  customTo,
  pick,
  years,
  showClear,
  onQuery,
  onMonth,
  onCustomFrom,
  onCustomTo,
  onPick,
  onClear,
}: {
  query: string;
  preset: RangePreset;
  overdue: boolean;
  customFrom: string;
  customTo: string;
  pick: PeriodPick;
  years: number[];
  showClear: boolean;
  onQuery: (value: string) => void;
  onMonth: (value: RangePreset | "overdue") => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  onPick: (value: PeriodPick) => void;
  onClear: () => void;
}) {
  const selectValue = overdue ? "overdue" : preset;
  const showPicker = !overdue && (preset === "month" || preset === "quarter");

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="canvas-search"
            value={query}
            placeholder="Search account, deal, or reason"
            onChange={(event) => onQuery(event.target.value)}
            className="h-9 rounded-xl border-transparent bg-muted/50 pl-9 focus-visible:bg-card"
          />
        </div>
        <Select value={selectValue} onValueChange={(value) => onMonth(value as RangePreset | "overdue")}>
          <SelectTrigger aria-label="Period" className="h-9 w-full rounded-xl bg-card sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showClear ? (
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            <X className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      {showPicker ? (
        <div className="grid grid-cols-2 gap-2 lg:w-[300px] lg:shrink-0">
          {preset === "month" ? (
            <Select
              value={String(pick.month)}
              onValueChange={(value) => onPick({ ...pick, month: Number(value) })}
            >
              <SelectTrigger aria-label="Month" className="h-9 w-full rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, index) => (
                  <SelectItem key={name} value={String(index)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={String(pick.quarter)}
              onValueChange={(value) => onPick({ ...pick, quarter: Number(value) })}
            >
              <SelectTrigger aria-label="Quarter" className="h-9 w-full rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUARTER_LABELS.map((label, index) => (
                  <SelectItem key={label} value={String(index)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={String(pick.year)} onValueChange={(value) => onPick({ ...pick, year: Number(value) })}>
            <SelectTrigger aria-label="Year" className="h-9 w-full rounded-xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {preset === "custom" && !overdue ? (
        <div className="grid grid-cols-2 gap-2 lg:w-[300px] lg:shrink-0">
          <Input
            type="month"
            aria-label="From"
            value={customFrom}
            onChange={(event) => onCustomFrom(event.target.value)}
            className="h-9 rounded-xl bg-card"
          />
          <Input
            type="month"
            aria-label="To"
            value={customTo}
            onChange={(event) => onCustomTo(event.target.value)}
            className="h-9 rounded-xl bg-card"
          />
        </div>
      ) : null}
    </div>
  );
}
