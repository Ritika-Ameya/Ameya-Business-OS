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
import type { RangePreset } from "@/features/canvas/types/canvas";

const MONTH_OPTIONS: Array<{ value: RangePreset | "overdue"; label: string }> = [
  { value: "this-month", label: "This month" },
  { value: "next-month", label: "Next month" },
  { value: "last-month", label: "Last month" },
  { value: "month-after", label: "Month after" },
  { value: "rolling-3", label: "Next 3 months" },
  { value: "this-quarter", label: "This quarter" },
  { value: "next-quarter", label: "Next quarter" },
  { value: "all", label: "All months" },
  { value: "overdue", label: "Overdue" },
  { value: "custom", label: "Custom range" },
];

export function CanvasFilters({
  query,
  preset,
  overdue,
  customFrom,
  customTo,
  showClear,
  onQuery,
  onMonth,
  onCustomFrom,
  onCustomTo,
  onClear,
}: {
  query: string;
  preset: RangePreset;
  overdue: boolean;
  customFrom: string;
  customTo: string;
  showClear: boolean;
  onQuery: (value: string) => void;
  onMonth: (value: RangePreset | "overdue") => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  onClear: () => void;
}) {
  const selectValue = overdue ? "overdue" : preset;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="canvas-search"
            value={query}
            placeholder="Search account, deal, or reason"
            onChange={(event) => onQuery(event.target.value)}
            className="h-9 rounded-xl border-border/70 bg-card pl-9"
          />
        </div>
        <Select value={selectValue} onValueChange={(value) => onMonth(value as RangePreset | "overdue")}>
          <SelectTrigger className="h-9 w-full rounded-xl bg-card sm:w-[180px]">
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

      {preset === "custom" && !overdue ? (
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
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
