import type { DashboardFinanceCashLineDto } from "@/features/dashboard/api/dashboard.dto";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { formatDate } from "@/shared/utils/format-date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export function FinanceCashDetailDialog({
  open,
  kind,
  periodLabel,
  total,
  items,
  onOpenChange,
}: {
  open: boolean;
  kind: "revenue" | "expense" | "difference" | null;
  periodLabel: string;
  total: number;
  items: DashboardFinanceCashLineDto[];
  onOpenChange: (open: boolean) => void;
}) {
  const title =
    kind === "revenue"
      ? "Money in · marked received"
      : kind === "expense"
        ? "Money out · marked paid"
        : kind === "difference"
          ? "Difference"
          : "Cash detail";
  const description =
    kind === "revenue"
      ? `Only payments marked received in ${periodLabel}. Pending or expected amounts are not included.`
      : kind === "expense"
        ? `Only expenses marked paid in ${periodLabel}. Pending expenses are not included.`
        : kind === "difference"
          ? `Money in minus money out for ${periodLabel}. Both sides count only marked-paid cash.`
          : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <p className="pt-2 text-2xl font-bold tabular-nums tracking-tight">
            {formatInvoiceCurrency(total)}
          </p>
          <p className="text-xs text-muted-foreground">
            {items.length} line{items.length === 1 ? "" : "s"} · {periodLabel}
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {kind === "difference" ? (
            <p className="text-sm text-muted-foreground">
              Open Money in or Money out to see the payment lines behind this net figure.
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No marked-{kind === "revenue" ? "received" : "paid"} lines in this period.
            </p>
          ) : (
            <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.label}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.date ? formatDate(item.date) : "No date"}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatInvoiceCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
