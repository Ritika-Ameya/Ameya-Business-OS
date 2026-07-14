import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import type { DashboardSummaryDto } from "@/features/dashboard/api/dashboard.dto";
import { getErrorMessage } from "@/shared/api/getErrorMessage";

interface DashboardContextValue {
  summary: DashboardSummaryDto | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export { DashboardContext };

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load from backend on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void refreshDashboard();
  }, [refreshDashboard]);

  const value = useMemo(
    () => ({ summary, loading, error, refreshDashboard }),
    [summary, loading, error, refreshDashboard]
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}
