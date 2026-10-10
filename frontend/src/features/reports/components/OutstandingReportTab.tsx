import {
  AlertCircle,
  CalendarClock,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog } from "@/shared/components/StatDetailDialog";
import { OutstandingReportTable } from "@/features/reports/components/OutstandingReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import {
  formatOutstandingReportStats,
  mapOutstandingRow,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import type { ReportFilters } from "@/features/reports/types/reports";
import { getReportFilterPeriod } from "@/features/reports/utils/report-utils";
import {
  countLabel,
  invoiceRow,
  sumBy,
  type ReportDetail,
} from "@/features/reports/utils/report-detail";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";

interface OutstandingReportTabProps {
  filters: ReportFilters;
}

type OutstandingCard = "amount" | "pending" | "overdue" | "average";

export function OutstandingReportTab({ filters }: OutstandingReportTabProps) {
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getOutstanding(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);
  const [openCard, setOpenCard] = useState<OutstandingCard | null>(null);

  const rows = useMemo(
    () => (data?.items ?? []).map(mapOutstandingRow),
    [data]
  );
  const stats = useMemo(
    () =>
      data
        ? formatOutstandingReportStats(data.stats)
        : {
            outstandingAmount: "—",
            invoicesPending: "—",
            overdueInvoices: "—",
            averageOutstanding: "—",
          },
    [data]
  );
  const period = getReportFilterPeriod(filters);

  const detail = useMemo<ReportDetail | null>(() => {
    if (!openCard) return null;
    const total = sumBy(rows, (row) => row.invoice.outstanding);
    const toRow = (row: (typeof rows)[number]) =>
      invoiceRow(
        row.invoice,
        row.invoice.outstanding,
        row.daysOverdue > 0
          ? `${row.daysOverdue} day${row.daysOverdue === 1 ? "" : "s"} overdue · total ${formatInvoiceCurrency(row.invoice.amount)}`
          : `Not overdue yet · total ${formatInvoiceCurrency(row.invoice.amount)}`
      );
    switch (openCard) {
      case "amount":
        return {
          title: "Outstanding Amount",
          description: `${formatInvoiceCurrency(total)} = invoice total minus money received, across ${countLabel(rows.length, "pending invoice")} in ${period}.`,
          rows: rows.map(toRow),
          empty: "Nothing outstanding in this view.",
          nameLabel: "Invoice",
          valueLabel: "Outstanding",
        };
      case "pending":
        return {
          title: "Invoices Pending",
          description: `${countLabel(rows.length, "invoice")} in ${period} still have money to collect.`,
          rows: rows.map(toRow),
          empty: "No pending invoices in this view.",
          nameLabel: "Invoice",
          valueLabel: "Outstanding",
        };
      case "overdue": {
        const overdueStatus = new Set(
          (data?.items ?? []).filter((item) => item.status === "overdue").map((item) => item.id)
        );
        const list = rows.filter(
          (row) =>
            row.invoice.outstanding > 0 &&
            row.invoice.dueDate &&
            (row.daysOverdue > 0 || overdueStatus.has(row.invoice.id))
        );
        return {
          title: "Overdue Invoices",
          description: `${countLabel(list.length, "invoice")} past the due date with money still owed: ${formatInvoiceCurrency(sumBy(list, (row) => row.invoice.outstanding))}.`,
          rows: [...list].sort((a, b) => b.daysOverdue - a.daysOverdue).map(toRow),
          empty: "Nothing is overdue.",
          nameLabel: "Invoice",
          valueLabel: "Outstanding",
        };
      }
      case "average":
        return {
          title: "Average Outstanding",
          description: rows.length
            ? `${formatInvoiceCurrency(total)} ÷ ${countLabel(rows.length, "invoice")} = ${stats.averageOutstanding}.`
            : "No pending invoices in this view.",
          rows: rows.map(toRow),
          empty: "No pending invoices in this view.",
          nameLabel: "Invoice",
          valueLabel: "Outstanding",
        };
      default:
        return null;
    }
  }, [openCard, rows, period, stats.averageOutstanding, data]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading outstanding report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Outstanding Amount"
          value={stats.outstandingAmount}
          icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
          period={period}
          onClick={data ? () => setOpenCard("amount") : undefined}
        />
        <StatCard
          label="Invoices Pending"
          value={stats.invoicesPending}
          icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
          period={period}
          onClick={data ? () => setOpenCard("pending") : undefined}
        />
        <StatCard
          label="Overdue Invoices"
          value={stats.overdueInvoices}
          icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
          accent="bg-red-500/10"
          period={period}
          onClick={data ? () => setOpenCard("overdue") : undefined}
        />
        <StatCard
          label="Average Outstanding"
          value={stats.averageOutstanding}
          icon={<Clock className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
          period={period}
          onClick={data ? () => setOpenCard("average") : undefined}
        />
      </div>

      <OutstandingReportTable rows={rows} />

      <StatDetailDialog
        open={Boolean(detail)}
        title={detail?.title ?? ""}
        description={detail?.description}
        rows={detail?.rows ?? []}
        empty={detail?.empty ?? ""}
        nameLabel={detail?.nameLabel}
        valueLabel={detail?.valueLabel}
        onOpenChange={(open) => {
          if (!open) setOpenCard(null);
        }}
      />
    </div>
  );
}
