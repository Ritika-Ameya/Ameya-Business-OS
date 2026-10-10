import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog, type StatDetailRow } from "@/shared/components/StatDetailDialog";
import { RenewalReportTable } from "@/features/reports/components/RenewalReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import type { RenewalReportItemDto } from "@/features/reports/api/reports.dto";
import {
  formatRenewalReportStats,
  mapReportRenewal,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import type { ReportFilters } from "@/features/reports/types/reports";
import { getReportFilterPeriod } from "@/features/reports/utils/report-utils";
import { countLabel, sumBy, type ReportDetail } from "@/features/reports/utils/report-detail";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/revenue/utils/invoice-utils";

interface RenewalReportTabProps {
  filters: ReportFilters;
}

type RenewalCard = "upcoming" | "overdue" | "renewed" | "value";

const STATUS_LABEL: Record<RenewalReportItemDto["status"], string> = {
  upcoming: "Upcoming",
  overdue: "Overdue",
  renewed: "Renewed",
};

export function RenewalReportTab({ filters }: RenewalReportTabProps) {
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getRenewals(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);
  const [openCard, setOpenCard] = useState<RenewalCard | null>(null);

  const renewals = useMemo(
    () => (data?.items ?? []).map(mapReportRenewal),
    [data]
  );
  const stats = useMemo(
    () =>
      data
        ? formatRenewalReportStats(data.stats)
        : {
            upcomingRenewals: "—",
            overdueRenewals: "—",
            renewed: "—",
            renewalValue: "—",
          },
    [data]
  );
  const period = getReportFilterPeriod(filters);

  const detail = useMemo<ReportDetail | null>(() => {
    if (!openCard) return null;
    const items = data?.items ?? [];
    const toRow = (item: RenewalReportItemDto): StatDetailRow => ({
      id: item.id,
      title: `${item.customerName} · ${item.componentName || item.renewalLabel}`,
      subtitle: [
        item.dealTitle,
        `Renews ${formatInvoiceDate(item.renewalDate)}`,
        item.renewalFrequency || item.renewalType,
      ]
        .filter(Boolean)
        .join(" · "),
      detail: [
        STATUS_LABEL[item.status],
        item.lastRenewedDate ? `Last renewed ${formatInvoiceDate(item.lastRenewedDate)}` : "",
        item.gstAmount ? `GST ${formatInvoiceCurrency(item.gstAmount)} on top` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      value: formatInvoiceCurrency(item.amount),
      to: item.dealId ? `/deals/${item.dealId}` : undefined,
    });
    const build = (title: string, list: RenewalReportItemDto[], rule: string): ReportDetail => ({
      title,
      description: rule,
      rows: [...list].sort((a, b) => a.renewalDate.localeCompare(b.renewalDate)).map(toRow),
      empty: "No renewals here.",
      nameLabel: "Renewal",
      valueLabel: "Amount (before GST)",
    });
    switch (openCard) {
      case "upcoming": {
        const list = items.filter((r) => r.status === "upcoming" || r.status === "renewed");
        return build(
          "Upcoming Renewals",
          list,
          `${countLabel(list.length, "renewal")} in ${period} that are upcoming or already renewed for this cycle. Overdue renewals are counted separately.`
        );
      }
      case "overdue": {
        const list = items.filter((r) => r.status === "overdue");
        return build(
          "Overdue Renewals",
          list,
          `${countLabel(list.length, "renewal")} whose renewal date has passed without being renewed.`
        );
      }
      case "renewed": {
        const list = items.filter((r) => r.status === "renewed");
        return build(
          "Renewed",
          list,
          `${countLabel(list.length, "renewal")} already renewed for the current cycle.`
        );
      }
      case "value":
        return build(
          "Renewal Value",
          items,
          `${formatInvoiceCurrency(sumBy(items, (r) => r.amount))} = sum of base amounts (before GST) for ${countLabel(items.length, "renewal")} in ${period}.`
        );
      default:
        return null;
    }
  }, [openCard, data, period]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading renewal report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming Renewals"
          value={stats.upcomingRenewals}
          icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
          period={period}
          onClick={data ? () => setOpenCard("upcoming") : undefined}
        />
        <StatCard
          label="Overdue Renewals"
          value={stats.overdueRenewals}
          icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
          accent="bg-red-500/10"
          period={period}
          onClick={data ? () => setOpenCard("overdue") : undefined}
        />
        <StatCard
          label="Renewed"
          value={stats.renewed}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={period}
          onClick={data ? () => setOpenCard("renewed") : undefined}
        />
        <StatCard
          label="Renewal Value"
          value={stats.renewalValue}
          icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
          period={period}
          onClick={data ? () => setOpenCard("value") : undefined}
        />
      </div>

      <RenewalReportTable renewals={renewals} />

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
