import type { InvoiceFilters } from "@/features/revenue/types/invoice";

export type CollectionStatusFilter = "all" | "partial" | "overdue" | "sent" | "pending";

export interface CollectionFilters {
  customer: string;
  status: CollectionStatusFilter;
  date: InvoiceFilters["date"];
}

export type RenewalTypeFilter = "all" | "annual" | "quarterly" | "monthly";
export type RenewalStatusFilter = "all" | "upcoming" | "overdue" | "renewed";

export interface RenewalFilters {
  customer: string;
  renewalType: RenewalTypeFilter;
  date: InvoiceFilters["date"];
  status: RenewalStatusFilter;
}
