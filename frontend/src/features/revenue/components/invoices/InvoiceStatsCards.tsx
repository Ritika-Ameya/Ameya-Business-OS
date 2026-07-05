import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { StatCard } from "@/shared/components/PageHeader";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceStatsCardsProps {
  invoices: Invoice[];
}

export function InvoiceStatsCards({ invoices }: InvoiceStatsCardsProps) {
  const paid = invoices.filter((i) => i.status === "paid").length;
  const partial = invoices.filter((i) => i.status === "partial").length;
  const overdue = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Invoices"
        value={String(invoices.length)}
        icon={<FileText className="size-5 text-blue-600 dark:text-blue-400" />}
        accent="bg-blue-500/10"
      />
      <StatCard
        label="Paid"
        value={String(paid)}
        icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
      />
      <StatCard
        label="Partial"
        value={String(partial)}
        icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
        accent="bg-amber-500/10"
      />
      <StatCard
        label="Overdue"
        value={String(overdue)}
        icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
        accent="bg-red-500/10"
      />
    </div>
  );
}
