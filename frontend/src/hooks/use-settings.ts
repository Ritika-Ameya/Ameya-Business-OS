import { useAppConfig } from "@/hooks/use-app-config";

/** @deprecated Use useAppConfig — kept for Settings module compatibility. */
export function useSettings() {
  return useAppConfig();
}
