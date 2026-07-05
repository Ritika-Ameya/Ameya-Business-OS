import type { DatePreset } from "@/types/expense";

export type ReportTab = "revenue" | "expense" | "outstanding" | "renewal";

export type ReportDatePreset = Exclude<DatePreset, "all"> | "all";

export interface ReportFilters {
  datePreset: ReportDatePreset;
  dateFrom: string;
  dateTo: string;
  customer: string;
  deal: string;
  status: string;
  category: string;
  employee: string;
  vendor: string;
  search: string;
}
