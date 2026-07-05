import { Wallet } from "lucide-react";
import { seedPayments } from "@/features/revenue/data/seed-payments";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import {
  formatPaymentCurrency,
  formatPaymentDate,
  getPaymentModeLabel,
  getPaymentsByInvoiceId,
} from "@/features/revenue/utils/payment-utils";

interface InvoiceTimelineTabProps {
  invoiceId: string;
}

export function InvoiceTimelineTab({ invoiceId }: InvoiceTimelineTabProps) {
  const { paymentMethods } = useAppConfig();
  const payments = getPaymentsByInvoiceId(seedPayments, invoiceId);

  const activities =
    payments.length > 0
      ? payments.map((payment) => ({
          id: payment.id,
          title: "Payment recorded",
          description: `${formatPaymentCurrency(payment.amount)} via ${getPaymentModeLabel(payment.mode, paymentMethods)}`,
          date: formatPaymentDate(payment.paymentDate),
        }))
      : [
          {
            id: "placeholder",
            title: "Payment recorded",
            description: "Payment activity will appear here once recorded.",
            date: "—",
          },
        ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
      <h3 className="text-base font-medium">Timeline</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Invoice activity and payment history
      </p>
      <div className="mt-6 space-y-0">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
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
        ))}
      </div>
    </div>
  );
}
