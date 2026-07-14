import { apiRequest } from "@/shared/api/client";
import type { ReportFilters } from "@/features/reports/types/reports";
import type {
  ExpenseReportStatsDto,
  OutstandingReportItemDto,
  OutstandingReportStatsDto,
  RenewalReportItemDto,
  RenewalReportStatsDto,
  ReportExpenseItemDto,
  ReportInvoiceItemDto,
  ReportResultDto,
  RevenueReportStatsDto,
} from "@/features/reports/api/reports.dto";

const REPORTS_BASE = "/reports";

function toQueryParams(filters: ReportFilters): Record<string, string> {
  return {
    datePreset: filters.datePreset,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    customer: filters.customer,
    deal: filters.deal,
    status: filters.status,
    category: filters.category,
    employee: filters.employee,
    vendor: filters.vendor,
    search: filters.search,
  };
}

export const reportsApi = {
  getRevenue: (filters: ReportFilters) =>
    apiRequest<ReportResultDto<RevenueReportStatsDto, ReportInvoiceItemDto>>(
      `${REPORTS_BASE}/revenue`,
      { params: toQueryParams(filters) }
    ),

  getExpenses: (filters: ReportFilters) =>
    apiRequest<ReportResultDto<ExpenseReportStatsDto, ReportExpenseItemDto>>(
      `${REPORTS_BASE}/expenses`,
      { params: toQueryParams(filters) }
    ),

  getOutstanding: (filters: ReportFilters) =>
    apiRequest<
      ReportResultDto<OutstandingReportStatsDto, OutstandingReportItemDto>
    >(`${REPORTS_BASE}/outstanding`, { params: toQueryParams(filters) }),

  getRenewals: (filters: ReportFilters) =>
    apiRequest<ReportResultDto<RenewalReportStatsDto, RenewalReportItemDto>>(
      `${REPORTS_BASE}/renewals`,
      { params: toQueryParams(filters) }
    ),
};
