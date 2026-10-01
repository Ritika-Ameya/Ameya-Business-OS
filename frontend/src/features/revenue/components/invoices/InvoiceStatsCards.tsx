import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog, type StatDetailRow } from "@/shared/components/StatDetailDialog";
import { ALL_TIME } from "@/shared/utils/period-label";
import { formatInvoiceCurrency, invoiceStatusLabels } from "@/features/revenue/utils/invoice-utils";
import type { Invoice, InvoiceStatus } from "@/features/revenue/types/invoice";

type InvoiceCardKey = "all" | "paid" | "partially_paid" | "due";

interface InvoiceStatsCardsProps {
  invoices: Invoice[];
}

function invoiceRow(invoice: Invoice, showOutstanding: boolean): StatDetailRow {
  const status = invoiceStatusLabels[invoice.status as InvoiceStatus] ?? invoice.status;
  return {
    id: invoice.id,
    title: invoice.invoiceNo,
    subtitle: invoice.customerName,
    detail: showOutstanding
      ? `Status · ${status} · invoice total ${formatInvoiceCurrency(invoice.amount)}`
      : invoice.outstanding > 0.009
        ? `Status · ${status} · still to collect ${formatInvoiceCurrency(invoice.outstanding)}`
        : `Status · ${status}`,
    value: formatInvoiceCurrency(showOutstanding ? invoice.outstanding : invoice.amount),
    to: `/invoices/${invoice.id}`,
  };
}

export function InvoiceStatsCards({ invoices }: InvoiceStatsCardsProps) {
  const [openCard, setOpenCard] = useState<InvoiceCardKey | null>(null);
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const partiallyPaid = invoices.filter((invoice) => invoice.status === "partially_paid");
  const due = invoices.filter((invoice) => invoice.status === "due");
  const selected =
    openCard === "all"
      ? invoices
      : openCard === "paid"
        ? paid
        : openCard === "partially_paid"
          ? partiallyPaid
          : openCard === "due"
            ? due
            : [];
  const showOutstanding = openCard === "partially_paid" || openCard === "due";
  const titles: Record<InvoiceCardKey, string> = {
    all: "All invoices",
    paid: "Paid invoices",
    partially_paid: "Partially paid invoices",
    due: "Due invoices",
  };
  const descriptions: Record<InvoiceCardKey, string> = {
    all: "The amount is the full invoice total. Any balance still to collect is written under the status.",
    paid: "These invoices are fully paid. The amount is the invoice total.",
    partially_paid: "The amount is what is still left to collect on each invoice.",
    due: "The amount is what is still left to collect. Nothing has been received yet.",
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Invoices"
          value={String(invoices.length)}
          icon={<FileText className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("all")}
        />
        <StatCard
          label="Paid"
          value={String(paid.length)}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("paid")}
        />
        <StatCard
          label="Partially Paid"
          value={String(partiallyPaid.length)}
          icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("partially_paid")}
        />
        <StatCard
          label="Due"
          value={String(due.length)}
          icon={<AlertCircle className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("due")}
        />
      </div>
      <StatDetailDialog
        open={openCard !== null}
        title={openCard ? titles[openCard] : ""}
        description={openCard ? descriptions[openCard] : undefined}
        nameLabel="Invoice"
        valueLabel={showOutstanding ? "Outstanding" : "Invoice total"}
        rows={selected.map((invoice) => invoiceRow(invoice, showOutstanding))}
        empty="No invoices in this group."
        onOpenChange={(open) => {
          if (!open) setOpenCard(null);
        }}
      />
    </>
  );
}
