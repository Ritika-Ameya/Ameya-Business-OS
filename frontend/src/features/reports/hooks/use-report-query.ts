import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { ReportFilters } from "@/features/reports/types/reports";

interface UseReportQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useReportQuery<T>(
  filters: ReportFilters,
  fetcher: (filters: ReportFilters) => Promise<T>
): UseReportQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    const parsedFilters = JSON.parse(filterKey) as ReportFilters;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(parsedFilters);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [filterKey, fetcher]);

  return { data, loading, error };
}
