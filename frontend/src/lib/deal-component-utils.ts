import type { BillingType, ComponentStatus, DealComponent } from "@/types/deal-component";

export function formatComponentCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatComponentDate(date?: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getComponentsByDealId(
  components: DealComponent[],
  dealId: string
): DealComponent[] {
  return components.filter((component) => component.dealId === dealId);
}

export const billingTypeLabels: Record<BillingType, string> = {
  "one-time": "One Time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half Yearly",
  yearly: "Yearly",
};

export const componentStatusLabels: Record<ComponentStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

export const billingTypeStyles: Record<BillingType, string> = {
  "one-time": "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  monthly: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  quarterly: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "half-yearly": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  yearly: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export const componentStatusStyles: Record<ComponentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};
