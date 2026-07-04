import { getPaymentMethodLabel } from "@/lib/app-config-utils";
import type { SettingsPaymentMethod } from "@/types/settings";
import type { Payment, PaymentStatus } from "@/types/payment";

export function formatPaymentCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPaymentDate(date?: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getPaymentsByInvoiceId(
  payments: Payment[],
  invoiceId: string
): Payment[] {
  return payments.filter((payment) => payment.invoiceId === invoiceId);
}

export function getPaymentModeLabel(
  mode: string,
  methods: SettingsPaymentMethod[]
): string {
  return getPaymentMethodLabel(mode, methods);
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  received: "Received",
  pending: "Pending",
  failed: "Failed",
};

export const paymentStatusStyles: Record<PaymentStatus, string> = {
  received: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const paymentModeStyleFallback: Record<string, string> = {
  upi: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "bank-transfer": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cheque: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  cash: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "credit-card": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  "debit-card": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  other: "bg-muted text-muted-foreground",
};

export function getPaymentModeStyle(mode: string): string {
  return paymentModeStyleFallback[mode] ?? "bg-muted text-muted-foreground";
}
