import { apiRequest } from "@/shared/api/client";
import type { DashboardSummaryDto } from "@/features/dashboard/api/dashboard.dto";

const DASHBOARD_BASE = "/dashboard";

export const dashboardApi = {
  getSummary: () => apiRequest<DashboardSummaryDto>(DASHBOARD_BASE),
};
