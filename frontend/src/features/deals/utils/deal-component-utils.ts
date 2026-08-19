import { formatDate, toLocalIsoDate } from "@/shared/utils/format-date";
import type {
  BillingType,
  ComponentFormData,
  ComponentRenewalFrequency,
  ComponentStatus,
} from "@/features/deals/types/deal-component";

export function formatComponentCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatComponentDate(date?: string): string {
  return formatDate(date);
}

export function hasComponentRenewal(
  frequency?: ComponentRenewalFrequency | "" | null
): boolean {
  return Boolean(frequency) && frequency !== "none";
}

function parseLocalIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function addRenewalInterval(
  isoDate: string,
  frequency: ComponentRenewalFrequency
): string {
  if (!hasComponentRenewal(frequency) || frequency === "custom") {
    return isoDate.trim();
  }

  const date = parseLocalIsoDate(isoDate);
  if (!date) return "";

  if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  else if (frequency === "quarterly") date.setMonth(date.getMonth() + 3);
  else if (frequency === "half-yearly") date.setMonth(date.getMonth() + 6);
  else if (frequency === "yearly") date.setFullYear(date.getFullYear() + 1);
  else if (frequency === "biennial") date.setFullYear(date.getFullYear() + 2);

  return toLocalIsoDate(date);
}

export function subtractRenewalInterval(
  isoDate: string,
  frequency: ComponentRenewalFrequency
): string {
  if (!hasComponentRenewal(frequency) || frequency === "custom") {
    return isoDate.trim();
  }

  const date = parseLocalIsoDate(isoDate);
  if (!date) return "";

  if (frequency === "monthly") date.setMonth(date.getMonth() - 1);
  else if (frequency === "quarterly") date.setMonth(date.getMonth() - 3);
  else if (frequency === "half-yearly") date.setMonth(date.getMonth() - 6);
  else if (frequency === "yearly") date.setFullYear(date.getFullYear() - 1);
  else if (frequency === "biennial") date.setFullYear(date.getFullYear() - 2);

  return toLocalIsoDate(date);
}

/** First due date is the start date. Interval add is only used after a cycle is completed. */
export function computeComponentNextRenewal(
  startDate: string,
  frequency: ComponentRenewalFrequency,
  customNextDate = ""
): string {
  if (!hasComponentRenewal(frequency)) return "";

  if (frequency === "custom") {
    return customNextDate.trim() || startDate.trim() || "";
  }

  return startDate.trim();
}

export function getComponentCurrentDueDate(component: {
  renewalStartDate?: string;
  renewalDate?: string;
  lastRenewedDate?: string;
}): string {
  const start = (component.renewalStartDate || "").trim();
  const next = (component.renewalDate || "").trim();
  if (component.lastRenewedDate?.trim()) {
    return next || start;
  }
  if (!start) return next;
  if (!next) return start;
  const today = toLocalIsoDate();
  if (start >= today) return start;
  return next;
}

/** What marking the current cycle paid will record, and where next due will move. */
export function previewRenewalCyclePayment(component: {
  renewalFrequency?: ComponentRenewalFrequency | "" | null;
  renewalStartDate?: string;
  renewalDate?: string;
  lastRenewedDate?: string;
}): { paidForDate: string; nextDueDate: string } | null {
  const frequency = (component.renewalFrequency || "none") as ComponentRenewalFrequency;
  if (!hasComponentRenewal(frequency) || frequency === "custom") return null;

  const paidForDate = getComponentCurrentDueDate(component);
  if (!paidForDate) return null;
  if ((component.lastRenewedDate || "").trim() === paidForDate) return null;

  const nextDueDate = addRenewalInterval(paidForDate, frequency);
  if (!nextDueDate || nextDueDate === paidForDate) return null;
  return { paidForDate, nextDueDate };
}

/** Undo last paid cycle: that date becomes unpaid again. */
export function previewRenewalCycleRollback(component: {
  renewalFrequency?: ComponentRenewalFrequency | "" | null;
  renewalStartDate?: string;
  lastRenewedDate?: string;
}): { unpaidDate: string; previousPaidDate: string } | null {
  const frequency = (component.renewalFrequency || "none") as ComponentRenewalFrequency;
  if (!hasComponentRenewal(frequency)) return null;

  const unpaidDate = (component.lastRenewedDate || "").trim();
  if (!unpaidDate) return null;

  const start = (component.renewalStartDate || "").trim();
  const previous =
    frequency === "custom" ? "" : subtractRenewalInterval(unpaidDate, frequency);
  const previousPaidDate =
    previous && previous < unpaidDate && (!start || previous >= start) ? previous : "";

  return { unpaidDate, previousPaidDate };
}

export function resolveComponentRenewalDate(input: {
  renewalFrequency: ComponentRenewalFrequency;
  renewalStartDate: string;
  renewalDate?: string;
}): string {
  const frequency = input.renewalFrequency || "none";
  if (!hasComponentRenewal(frequency)) return "";

  const explicit = (input.renewalDate ?? "").trim();
  if (frequency === "custom") {
    return explicit || input.renewalStartDate.trim();
  }

  return explicit || input.renewalStartDate.trim();
}

export function validateComponentForm(
  data: ComponentFormData
): Partial<Record<keyof ComponentFormData, string>> {
  const errors: Partial<Record<keyof ComponentFormData, string>> = {};

  if (!data.name.trim()) {
    errors.name = "Component name is required";
  }

  if (!data.amount.trim()) {
    errors.amount = "Amount is required";
  } else if (parseAmount(data.amount) <= 0) {
    errors.amount = "Enter a valid amount";
  }

  if (data.gstPercent.trim()) {
    const gst = parseAmount(data.gstPercent);
    if (gst < 0 || gst > 100) {
      errors.gstPercent = "GST must be between 0 and 100";
    }
  }

  if (data.quantity.trim() && parseAmount(data.quantity) <= 0) {
    errors.quantity = "Enter a valid quantity";
  }

  if (data.discount.trim() && parseAmount(data.discount) < 0) {
    errors.discount = "Discount cannot be negative";
  }

  if (hasComponentRenewal(data.renewalFrequency)) {
    if (!data.renewalStartDate.trim()) {
      errors.renewalStartDate = "Renewal start date is required when frequency is selected";
    }
    if (data.renewalFrequency === "custom" && !data.renewalDate.trim()) {
      errors.renewalDate = "Custom renewal date is required";
    }
  }

  return errors;
}

export function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function computeComponentLineTotal(input: {
  amount: number;
  gstPercent?: number;
  quantity?: number;
  discount?: number;
}): number {
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
  const discount = Number(input.discount || 0);
  const gstPercent = Number(input.gstPercent || 0);
  const taxable = Math.max(0, Number(input.amount || 0) * quantity - discount);
  return Math.round((taxable + (taxable * gstPercent) / 100) * 100) / 100;
}

export function computeComponentFormTotal(data: ComponentFormData): number {
  return computeComponentLineTotal({
    amount: parseAmount(data.amount),
    gstPercent: parseAmount(data.gstPercent),
    quantity: parseAmount(data.quantity) || 1,
    discount: parseAmount(data.discount),
  });
}

export const componentRenewalFrequencyLabels: Record<ComponentRenewalFrequency, string> = {
  none: "No Renewal",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half Yearly",
  yearly: "Yearly",
  biennial: "Biennial",
  custom: "Custom Date",
};

export const componentRenewalFrequencyStyles: Record<ComponentRenewalFrequency, string> = {
  none: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  monthly: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  quarterly: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "half-yearly": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  yearly: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  biennial: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  custom: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export function billingTypeFromRenewalFrequency(
  frequency: ComponentRenewalFrequency | "" | null | undefined
): BillingType {
  if (frequency === "monthly") return "monthly";
  if (frequency === "quarterly") return "quarterly";
  if (frequency === "half-yearly") return "half-yearly";
  if (frequency === "yearly") return "yearly";
  return "one-time";
}

export const componentStatusLabels: Record<ComponentStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

export const componentStatusStyles: Record<ComponentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};
