import type { InvoiceFilters } from "@/features/revenue/types/invoice";

export type CollectionStatusFilter =
  | "all"
  | "partially_paid"
  | "due"
  | "pending";

export interface CollectionFilters {
  customer: string;
  status: CollectionStatusFilter;
  date: InvoiceFilters["date"];
}

export type RenewalTypeFilter = "all" | "annual" | "quarterly" | "monthly";
export type RenewalStatusFilter = "all" | "upcoming" | "expired" | "renewed";

/** Date presets for Revenue → Renewals (independent of invoice date filters). */
export type RenewalDatePreset =
  | "all"
  | "this-month"
  | "next-month"
  | "last-month"
  | "quarter"
  | "next-quarter"
  | "current-year"
  | "custom"
  | "month-wise"
  | "quarter-wise";

export interface RenewalFilters {
  customer: string;
  renewalType: RenewalTypeFilter;
  date: RenewalDatePreset;
  status: RenewalStatusFilter;
  customFrom: string;
  customTo: string;
  /** YYYY-MM when date === month-wise */
  selectedMonth: string;
  /** YYYY-Qn when date === quarter-wise */
  selectedQuarter: string;
}
