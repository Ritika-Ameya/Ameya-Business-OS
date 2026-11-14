import { apiRequest } from "@/shared/api/client";
import type {
  DashboardPeriodQuery,
  DashboardSummaryDto,
} from "@/features/dashboard/api/dashboard.dto";

const DASHBOARD_BASE = "/dashboard";

export const dashboardApi = {
  getSummary: (query?: Partial<DashboardPeriodQuery>) =>
    apiRequest<DashboardSummaryDto>(DASHBOARD_BASE, {
      params: {
        period: query?.period ?? "last-6-months",
        ...(query?.dateFrom ? { dateFrom: query.dateFrom } : {}),
        ...(query?.dateTo ? { dateTo: query.dateTo } : {}),
        ...(query?.year != null ? { year: query.year } : {}),
        ...(query?.month != null ? { month: query.month } : {}),
      },
    }),
};
