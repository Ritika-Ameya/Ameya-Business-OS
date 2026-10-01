import { useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, IndianRupee } from "lucide-react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog, type StatDetailRow } from "@/shared/components/StatDetailDialog";
import { ALL_TIME, AS_OF_TODAY, thisMonthPeriod } from "@/shared/utils/period-label";
import { formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import { getCollectionInvoices, getCollectionStats } from "@/features/revenue/utils/revenue-utils";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment } from "@/features/revenue/types/payment";

type CollectionCardKey = "outstanding" | "pending" | "overdue" | "month" | "total";

interface RevenueCollectionsStatsProps {
  invoices: Invoice[];
  payments: Payment[];
}

function isOverdue(invoice: Invoice): boolean {
  const due = new Date(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Boolean(invoice.dueDate) && due < today && invoice.outstanding > 0;
}

function invoiceBalanceRow(invoice: Invoice): StatDetailRow {
  return {
    id: invoice.id,
    title: invoice.invoiceNo,
    subtitle: invoice.customerName,
    detail: invoice.dueDate
      ? `Due ${formatInvoiceDate(invoice.dueDate)} · invoice total ${formatInvoiceCurrency(invoice.amount)}`
      : `Invoice total ${formatInvoiceCurrency(invoice.amount)}`,
    value: formatInvoiceCurrency(invoice.outstanding),
    to: `/invoices/${invoice.id}`,
  };
}

export function RevenueCollectionsStats({
  invoices,
  payments,
}: RevenueCollectionsStatsProps) {
  const stats = getCollectionStats(invoices, payments);
  const [openCard, setOpenCard] = useState<CollectionCardKey | null>(null);
  const collectionInvoices = getCollectionInvoices(invoices);
  const pending = collectionInvoices.filter((invoice) => invoice.outstanding > 0);
  const overdue = collectionInvoices.filter(isOverdue);
  const invoicesById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const now = new Date();
  const receivedPayments = payments.filter((payment) => {
    if (payment.status && payment.status !== "received") return false;
    const invoice = invoicesById.get(payment.invoiceId);
    return Boolean(invoice) && invoice?.status !== "cancelled";
  });
  const monthPayments = receivedPayments.filter((payment) => {
    const date = new Date(payment.paymentDate);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const paymentRow = (payment: Payment): StatDetailRow => {
    const invoice = invoicesById.get(payment.invoiceId);
    return {
      id: payment.id,
      title: invoice?.customerName || "Payment",
      subtitle: invoice ? `Invoice · ${invoice.invoiceNo}` : undefined,
      detail: `Received on ${formatInvoiceDate(payment.paymentDate)}`,
      value: formatInvoiceCurrency(payment.amount),
      to: invoice ? `/invoices/${invoice.id}` : undefined,
    };
  };

  const detail =
    openCard === "outstanding" || openCard === "pending"
      ? {
          title: openCard === "outstanding" ? "Outstanding amount" : "Invoices pending",
          description:
            openCard === "outstanding"
              ? "The amount is what is still left to collect on each open invoice."
              : "Invoices that still have a balance. The amount is the outstanding.",
          nameLabel: "Invoice",
          valueLabel: "Outstanding",
          rows: pending.map(invoiceBalanceRow),
          empty: "Nothing is outstanding.",
        }
      : openCard === "overdue"
        ? {
            title: "Overdue collections",
            description: "The due date has passed and a balance is still left. The amount is the outstanding.",
            nameLabel: "Invoice",
            valueLabel: "Outstanding",
            rows: overdue.map(invoiceBalanceRow),
            empty: "No overdue invoices.",
          }
        : openCard === "month"
          ? {
              title: "Collected this month",
              description: `Money actually received in ${thisMonthPeriod()}.`,
              nameLabel: "Payment",
              valueLabel: "Received",
              rows: monthPayments.map(paymentRow),
              empty: "Nothing collected this month.",
            }
          : openCard === "total"
            ? {
                title: "Total collected",
                description: `${receivedPayments.length} payments received so far. The amount is the money that came in.`,
                nameLabel: "Payment",
                valueLabel: "Received",
                rows: receivedPayments.map(paymentRow),
                empty: "No payments recorded.",
              }
            : null;

  return (
    <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Outstanding Amount"
        value={stats.outstandingAmount}
        icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
        accent="bg-amber-500/10"
        period={ALL_TIME}
        onClick={() => setOpenCard("outstanding")}
      />
      <StatCard
        label="Invoices Pending"
        value={stats.pendingCount}
        icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
        accent="bg-blue-500/10"
        period={ALL_TIME}
        onClick={() => setOpenCard("pending")}
      />
      <StatCard
        label="Overdue Collections"
        value={stats.overdueCount}
        icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
        accent="bg-red-500/10"
        period={AS_OF_TODAY}
        onClick={() => setOpenCard("overdue")}
      />
      <StatCard
        label="Collected This Month"
        value={stats.collectedThisMonth}
        icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
        period={thisMonthPeriod()}
        onClick={() => setOpenCard("month")}
      />
      <StatCard
        label="Total Collected"
        value={stats.totalCollected}
        icon={<IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
        period={ALL_TIME}
        onClick={() => setOpenCard("total")}
      />
    </div>
    <StatDetailDialog
      open={detail !== null}
      title={detail?.title ?? ""}
      description={detail?.description}
      nameLabel={detail?.nameLabel}
      valueLabel={detail?.valueLabel}
      rows={detail?.rows ?? []}
      empty={detail?.empty ?? ""}
      onOpenChange={(open) => {
        if (!open) setOpenCard(null);
      }}
    />
    </>
  );
}
