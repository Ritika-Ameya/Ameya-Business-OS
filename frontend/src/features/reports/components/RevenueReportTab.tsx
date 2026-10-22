import {
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Landmark,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog } from "@/shared/components/StatDetailDialog";
import { RevenueReportTable } from "@/features/reports/components/RevenueReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import type { RevenueReportPaymentDto } from "@/features/reports/api/reports.dto";
import {
  formatRevenueReportStats,
  mapReportInvoice,
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
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/revenue/utils/invoice-utils";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { getPaymentMethodLabel } from "@/features/settings/utils/app-config-utils";
import type { SettingsPaymentMethod } from "@/features/settings/types/settings";

interface RevenueReportTabProps {
  filters: ReportFilters;
}

type RevenueCard =
  | "totalRevenue"
  | "collected"
  | "outstanding"
  | "average"
  | "fyTotal"
  | "fyInnovex"
  | "fyRitika"
  | "viewInnovex"
  | "viewRitika"
  | "gstBilled";

const ACCOUNT_LABEL = { innovex: "Ameya Innovex", ritika: "Ritika (Non-GST)" } as const;

function paymentRows(payments: RevenueReportPaymentDto[], methods: SettingsPaymentMethod[]) {
  return payments.map((payment) => ({
    id: payment.id,
    title: `${payment.invoiceNo || "Invoice"} · ${payment.customerName}`,
    subtitle: [
      payment.paidAt ? `Paid ${formatInvoiceDate(payment.paidAt)}` : "",
      payment.method ? getPaymentMethodLabel(payment.method, methods) : "",
      ACCOUNT_LABEL[payment.account],
    ]
      .filter(Boolean)
      .join(" · "),
    value: formatInvoiceCurrency(payment.amount),
    to: `/invoices/${payment.invoiceId}`,
  }));
}

export function RevenueReportTab({ filters }: RevenueReportTabProps) {
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getRevenue(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);
  const { paymentMethods } = useAppConfig();
  const [openCard, setOpenCard] = useState<RevenueCard | null>(null);

  const invoices = useMemo(
    () => (data?.items ?? []).map(mapReportInvoice),
    [data]
  );
  const payments = useMemo(() => data?.payments ?? [], [data]);
  const stats = useMemo(
    () =>
      data
        ? formatRevenueReportStats(data.stats)
        : {
            totalRevenue: "—",
            collected: "—",
            outstanding: "—",
            averageInvoiceValue: "—",
            receivedGstAccount: "—",
            receivedOtherAccount: "—",
            gstBilled: "—",
            financialYearCollection: "—",
            financialYearLabel: "Current financial year",
            financialYearInnovex: "—",
            financialYearRitika: "—",
          },
    [data]
  );
  const period = getReportFilterPeriod(filters);

  const detail = useMemo<ReportDetail | null>(() => {
    if (!openCard) return null;
    const fyLabel = data?.stats.financialYearLabel || "Current financial year";
    const paymentDetail = (
      title: string,
      list: RevenueReportPaymentDto[],
      scope: string
    ): ReportDetail => ({
      title,
      description: `${formatInvoiceCurrency(sumBy(list, (p) => p.amount))} = sum of ${countLabel(list.length, "received payment")} ${scope}. Cancelled invoices and payments not yet received are left out.`,
      rows: paymentRows(list, paymentMethods),
      empty: "No payments received here.",
      nameLabel: "Payment",
      valueLabel: "Amount",
    });

    switch (openCard) {
      case "totalRevenue":
        return {
          title: "Total Revenue",
          description: `${formatInvoiceCurrency(sumBy(invoices, (i) => i.amount))} = sum of invoice totals (incl. GST) for ${countLabel(invoices.length, "invoice")} in ${period}.`,
          rows: invoices.map((invoice) => invoiceRow(invoice, invoice.amount, invoice.status)),
          empty: "No invoices in this view.",
          nameLabel: "Invoice",
          valueLabel: "Invoice total",
        };
      case "collected": {
        const list = invoices.filter((invoice) => invoice.received > 0);
        return {
          title: "Collected",
          description: `${formatInvoiceCurrency(sumBy(list, (i) => i.received))} = cash that reached the bank on ${countLabel(list.length, "invoice")} in ${period}. TDS is not included.`,
          rows: list.map((invoice) =>
            invoiceRow(invoice, invoice.received, `Invoice total ${formatInvoiceCurrency(invoice.amount)}`)
          ),
          empty: "Nothing collected on these invoices yet.",
          nameLabel: "Invoice",
          valueLabel: "Received",
        };
      }
      case "outstanding": {
        const list = invoices.filter((invoice) => invoice.outstanding > 0);
        return {
          title: "Outstanding",
          description: `${formatInvoiceCurrency(sumBy(list, (i) => i.outstanding))} = still due on ${countLabel(list.length, "invoice")} in ${period}. Cash in the bank is separate. TDS marked as settled reduces this balance.`,
          rows: list.map((invoice) =>
            invoiceRow(
              invoice,
              invoice.outstanding,
              `Total ${formatInvoiceCurrency(invoice.amount)} · cash in bank ${formatInvoiceCurrency(invoice.received)}`
            )
          ),
          empty: "Nothing outstanding in this view.",
          nameLabel: "Invoice",
          valueLabel: "Outstanding",
        };
      }
      case "average": {
        const total = sumBy(invoices, (i) => i.amount);
        return {
          title: "Average Invoice Value",
          description: invoices.length
            ? `${formatInvoiceCurrency(total)} ÷ ${countLabel(invoices.length, "invoice")} = ${stats.averageInvoiceValue}.`
            : "No invoices in this view.",
          rows: invoices.map((invoice) => invoiceRow(invoice, invoice.amount, invoice.status)),
          empty: "No invoices in this view.",
          nameLabel: "Invoice",
          valueLabel: "Invoice total",
        };
      }
      case "fyTotal":
        return paymentDetail(
          "Total Collection",
          payments.filter((p) => p.inFinancialYear),
          `dated in ${fyLabel} (1 Apr–31 Mar), both accounts`
        );
      case "fyInnovex":
        return paymentDetail(
          "Ameya Innovex",
          payments.filter((p) => p.inFinancialYear && p.account === "innovex"),
          `in ${fyLabel} that landed in Ameya Innovex (GST account, includes international clients)`
        );
      case "fyRitika":
        return paymentDetail(
          "Ritika",
          payments.filter((p) => p.inFinancialYear && p.account === "ritika"),
          `in ${fyLabel} that landed in Ritika (Non-GST, domestic clients)`
        );
      case "viewInnovex":
        return paymentDetail(
          "Ameya Innovex · this view",
          payments.filter((p) => p.inView && p.account === "innovex"),
          `on the invoices in ${period}, landed in Ameya Innovex`
        );
      case "viewRitika":
        return paymentDetail(
          "Ritika · this view",
          payments.filter((p) => p.inView && p.account === "ritika"),
          `on the invoices in ${period}, landed in Ritika`
        );
      case "gstBilled": {
        const list = invoices.filter(
          (invoice) => invoice.billingType === "gst" && invoice.status !== "cancelled"
        );
        return {
          title: "GST billed (payable)",
          description: `${formatInvoiceCurrency(sumBy(list, (i) => i.tax))} = GST charged on ${countLabel(list.length, "GST invoice")} in ${period}. Cancelled and Non-GST invoices are left out.`,
          rows: list.map((invoice) =>
            invoiceRow(
              invoice,
              invoice.tax,
              `Base ${formatInvoiceCurrency(invoice.subtotal)} · GST ${invoice.gstPercent}%`
            )
          ),
          empty: "No GST invoices in this view.",
          nameLabel: "Invoice",
          valueLabel: "GST",
        };
      }
      default:
        return null;
    }
  }, [openCard, invoices, payments, period, stats.averageInvoiceValue, data, paymentMethods]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading revenue report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={stats.totalRevenue}
          icon={<TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
          period={period}
          onClick={data ? () => setOpenCard("totalRevenue") : undefined}
        />
        <StatCard
          label="Collected"
          value={stats.collected}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={period}
          onClick={data ? () => setOpenCard("collected") : undefined}
        />
        <StatCard
          label="Outstanding"
          value={stats.outstanding}
          icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
          period={period}
          onClick={data ? () => setOpenCard("outstanding") : undefined}
        />
        <StatCard
          label="Average Invoice Value"
          value={stats.averageInvoiceValue}
          icon={<AlertCircle className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
          period={period}
          onClick={data ? () => setOpenCard("average") : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Collection"
          value={stats.financialYearCollection}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={`${stats.financialYearLabel} · Actual money received, 1 Apr–31 Mar`}
          onClick={data ? () => setOpenCard("fyTotal") : undefined}
        />
        <StatCard
          label="Ameya Innovex"
          value={stats.financialYearInnovex}
          icon={<Receipt className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period="GST account · includes international clients"
          onClick={data ? () => setOpenCard("fyInnovex") : undefined}
        />
        <StatCard
          label="Ritika"
          value={stats.financialYearRitika}
          icon={<Receipt className="size-5 text-sky-600 dark:text-sky-400" />}
          accent="bg-sky-500/10"
          period="Non-GST account · domestic clients only"
          onClick={data ? () => setOpenCard("fyRitika") : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Ameya Innovex · this view"
          value={stats.receivedGstAccount}
          icon={<Receipt className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={`${period} · payments on these invoices`}
          onClick={data ? () => setOpenCard("viewInnovex") : undefined}
        />
        <StatCard
          label="Ritika · this view"
          value={stats.receivedOtherAccount}
          icon={<Receipt className="size-5 text-sky-600 dark:text-sky-400" />}
          accent="bg-sky-500/10"
          period={`${period} · payments on these invoices`}
          onClick={data ? () => setOpenCard("viewRitika") : undefined}
        />
        <StatCard
          label="GST billed (payable)"
          value={stats.gstBilled}
          icon={<Landmark className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
          period={period}
          onClick={data ? () => setOpenCard("gstBilled") : undefined}
        />
      </div>

      <RevenueReportTable invoices={invoices} />

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
