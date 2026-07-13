import { History, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { formatDate } from "@/shared/utils";
import {
  formatPaymentCurrency,
  formatPaymentDate,
  getPaymentModeLabel,
} from "@/features/revenue/utils/payment-utils";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceTimelineTabProps {
  invoice: Invoice;
}

export function InvoiceTimelineTab({ invoice }: InvoiceTimelineTabProps) {
  const { paymentMethods } = useAppConfig();
  const { getPaymentsByInvoiceId } = useRevenue();
  const payments = getPaymentsByInvoiceId(invoice.id);

  const activities = useMemo(() => {
    const timelineItems = (invoice.timeline ?? []).map((entry) => ({
      id: entry.id,
      title: entry.stageName || entry.action || "Invoice activity",
      description: entry.notes || "—",
      date: formatDate(entry.timestamp.split("T")[0] ?? entry.timestamp),
      kind: "timeline" as const,
      sortAt: new Date(entry.timestamp).getTime(),
    }));

    const paymentItems = payments.map((payment) => ({
      id: payment.id,
      title: "Payment recorded",
      description: `${formatPaymentCurrency(payment.amount)} via ${getPaymentModeLabel(payment.mode, paymentMethods)}`,
      date: formatPaymentDate(payment.paymentDate),
      kind: "payment" as const,
      sortAt: new Date(payment.paymentDate).getTime(),
    }));

    return [...timelineItems, ...paymentItems].sort((a, b) => b.sortAt - a.sortAt);
  }, [invoice.timeline, payments, paymentMethods]);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
      <h3 className="text-base font-medium">Timeline</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Invoice activity and payment history
      </p>
      <div className="mt-6 space-y-0">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Timeline activity will appear here once recorded.
          </p>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                  {activity.kind === "payment" ? (
                    <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <History className="size-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="mb-6 flex-1 rounded-xl border border-border/50 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
