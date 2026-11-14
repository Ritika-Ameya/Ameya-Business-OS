import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import type {
  DashboardPeriod,
  DashboardPeriodQuery,
  DashboardSummaryDto,
} from "@/features/dashboard/api/dashboard.dto";
import { getErrorMessage } from "@/shared/api/getErrorMessage";

export interface DashboardPeriodState {
  period: DashboardPeriod;
  dateFrom: string;
  dateTo: string;
  year: number;
  month: number;
}

interface DashboardContextValue {
  summary: DashboardSummaryDto | null;
  loading: boolean;
  error: string | null;
  period: DashboardPeriodState;
  setPeriod: (next: Partial<DashboardPeriodState>) => void;
  refreshDashboard: (options?: { silent?: boolean }) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export { DashboardContext };

const currentYear = () => new Date().getFullYear();
const currentMonth = () => new Date().getMonth() + 1;

const defaultPeriod = (): DashboardPeriodState => ({
  period: "last-6-months",
  dateFrom: "",
  dateTo: "",
  year: currentYear(),
  month: currentMonth(),
});

const toQuery = (period: DashboardPeriodState): Partial<DashboardPeriodQuery> => {
  const query: Partial<DashboardPeriodQuery> = { period: period.period };
  if (period.period === "custom") {
    if (period.dateFrom) query.dateFrom = period.dateFrom;
    if (period.dateTo) query.dateTo = period.dateTo;
  }
  if (period.period === "year" || period.period === "month") {
    query.year = period.year;
  }
  if (period.period === "month") {
    query.month = period.month;
  }
  return query;
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriodState] = useState<DashboardPeriodState>(defaultPeriod);

  const refreshDashboard = useCallback(
    async (options?: { silent?: boolean; periodOverride?: DashboardPeriodState }) => {
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        const data = await dashboardApi.getSummary(
          toQuery(options?.periodOverride ?? period)
        );
        setSummary(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [period]
  );

  const setPeriod = useCallback((next: Partial<DashboardPeriodState>) => {
    setPeriodState((current) => {
      const merged = { ...current, ...next };
      void dashboardApi
        .getSummary(toQuery(merged))
        .then((data) => {
          setSummary(data);
          setError(null);
        })
        .catch((err) => setError(getErrorMessage(err)));
      return merged;
    });
  }, []);

  useEffect(() => {
    void refreshDashboard();
    // Initial load only — period changes go through setPeriod.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount fetch
  }, []);

  const value = useMemo(
    () => ({
      summary,
      loading,
      error,
      period,
      setPeriod,
      refreshDashboard,
    }),
    [summary, loading, error, period, setPeriod, refreshDashboard]
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}
